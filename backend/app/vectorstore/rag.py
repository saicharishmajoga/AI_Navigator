from groq import AsyncGroq
from ..core.config import settings
from ..database.session import AsyncSessionLocal
from ..models.tool import Tool
from sqlalchemy import select

async def ask_rag_stream(query: str):
    """
    Search SQL database records for all registered AI tools, compile a comprehensive
    discovery prompt, and stream answers directly using the Groq AI engine.
    """
    # 1. Query the SQL Database for all registered tools in the project
    db_tools_list = []
    try:
        async with AsyncSessionLocal() as session:
            stmt = select(Tool)
            res = await session.execute(stmt)
            all_db_tools = res.scalars().all()
            for t in all_db_tools:
                db_tools_list.append({
                    "name": t.name,
                    "slug": t.slug,
                    "description": t.description,
                    "pricing": t.pricing_type,
                    "website": t.official_website
                })
    except Exception as e:
        print(f"RAG SQL database query error: {e}")

    # 2. Build grounded SQL context
    db_tools_context = []
    for t in db_tools_list:
        db_tools_context.append(
            f"Registered Tool Name: {t['name']} (slug: {t['slug']})\n"
            f"Website: {t['website']}\n"
            f"Pricing model: {t['pricing']}\n"
            f"Direct Description: {t['description']}"
        )
    db_tools_str = "\n\n---\n\n".join(db_tools_context)

    # 3. Formulate the advanced system instruction matching user discovery, fallback & comparison modes
    system_prompt = (
        "You are Antigravity, a professional AI Ecosystem Navigator and discovery assistant. "
        "You help users learn about, compare, and integrate AI tools like LangChain, LlamaIndex, Ollama, ChromaDB, Hugging Face, AutoGen, and open-source models.\n\n"
        "=== PRIMARY OBJECTIVE ===\n"
        "Help users answer questions about any tool, framework, model, library, API, or component that exists in this project.\n\n"
        "=== BEHAVIOR RULES ===\n"
        "1. NEVER immediately say 'I don't have information about X'.\n"
        "2. Before stating that information is unavailable, search all registered SQL tool lists, aliases, and dependencies.\n"
        "3. If a tool exists in the project (listed below in REGISTERED TOOLS DIRECTORY), explain what it does, describe its purpose, list capabilities, integrations, and provide active examples.\n"
        "4. If the exact tool is not documented inside the database directory, use your general knowledge and reasoning to answer. Clearly state:\n"
        "   'I couldn't find project-specific documentation for this item. Based on available information and general knowledge, here's what I can tell you...'\n"
        "   Then provide the best, most comprehensive answer possible.\n"
        "5. When users ask 'What tools do you have?', 'List all tools', or 'What can this project do?', generate a complete and detailed inventory including: Tool name, Description, Inputs, Outputs, and Example usage.\n"
        "6. TOOL DISCOVERY MODE: If a user mentions a tool, search for exact matches, partial matches, aliases, or related frameworks.\n"
        "7. COMPARISON MODE: If asked to compare, present clean markdown tables covering features, strengths, weaknesses, use cases, pricing, and performance metrics.\n"
        "8. CODE ASSISTANCE: Provide high-quality copyable code examples, command line setups, and configuration guides when relevant.\n"
        "9. RESPONSE STYLE: Be helpful, technical, concise, accurate, and highly actionable. Always attempt to answer using the best available information before stating limitations.\n\n"
        f"=== REGISTERED PROJECT SQL DIRECTORY ===\n{db_tools_str}"
    )

    # 4. Stream response from Groq LLM
    if not settings.GROQ_API_KEY:
        yield "\n\n*Error: GROQ_API_KEY is not configured in the backend environment variables on Render. Please configure it in your Render dashboard under Environment Variables.*"
        return

    try:
        client = AsyncGroq(api_key=settings.GROQ_API_KEY)
        
        # We use llama-3.3-70b-versatile for maximum reasoning quality or fallback to llama-3.1-8b-instant
        model_name = "llama-3.3-70b-versatile"
        try:
            chat_completion = await client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": query}
                ],
                temperature=0.2,
                max_tokens=2048,
                stream=True
            )
        except Exception:
            # Fallback to llama-3.1-8b-instant for rate limit or model issues
            chat_completion = await client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": query}
                ],
                temperature=0.2,
                max_tokens=2048,
                stream=True
            )

        async for chunk in chat_completion:
            content = chunk.choices[0].delta.content or ""
            if content:
                yield content
                
    except Exception as e:
        yield f"\n\n*Error generating assistant response: {e}*"
