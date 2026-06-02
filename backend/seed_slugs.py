import asyncio
import json
import subprocess
from pathlib import Path
from sqlalchemy import select, text
from app.database.session import AsyncSessionLocal, engine
from app.models.tool import Tool
from app.models.category import Category
from app.models.tool_version import ToolVersion
from app.models.notification import Notification
from app.vectorstore.chroma_store import get_chroma_store
from app.services.vector_sync import VectorSyncService


async def seed_clean_database():
    print("=" * 60)
    print("AI Navigator - High-Fidelity Cleaning & Seeding Dynamic Knowledge...")
    print("=" * 60)

    # Step 1: Run Node/tsx extraction script to compile tool-details.ts to JSON
    print("\n[1/4] Running frontend configuration extractor via tsx...")
    try:
        # We run the tsx compiler command from the workspace root
        res = subprocess.run(
            ["npx", "tsx", "-e", "import { TOOL_DETAILS } from './src/lib/tool-details.ts'; import fs from 'fs'; fs.writeFileSync('./backend/app/vectorstore/tool_details.json', JSON.stringify(TOOL_DETAILS, null, 2));"],
            cwd=str(Path(__file__).parent.parent),
            capture_output=True,
            text=True,
            shell=True
        )
        if res.returncode != 0:
            print(f"Extraction warning: {res.stderr}")
        else:
            print("Successfully extracted tool_details.json.")
    except Exception as ex:
        print(f"Extraction error: {ex}")

    # Load extracted details
    json_path = Path(__file__).parent / "app" / "vectorstore" / "tool_details.json"
    if not json_path.exists():
        print(f"Error: tool_details.json not found at {json_path}")
        return

    with open(json_path, "r", encoding="utf-8") as f:
        rich_tools = json.load(f)

    db = AsyncSessionLocal()
    try:
        # Step 2: Clean existing relational tables
        print("\n[2/4] Wiping existing database records to avoid conflicts...")
        await db.execute(text("DELETE FROM tool_versions"))
        await db.execute(text("DELETE FROM notifications"))
        await db.execute(text("DELETE FROM tools"))
        await db.execute(text("DELETE FROM categories"))
        await db.commit()
        print("Database cleared successfully.")

        # Step 3: Reset ChromaDB collection
        print("\n[3/4] Resetting ChromaDB vector collection...")
        try:
            store = get_chroma_store(collection_name="ai_navigator")
            store.delete_collection()
            print("ChromaDB collection deleted successfully.")
        except Exception as ce:
            print(f"Note (ChromaDB reset): {ce}")

        # Step 4: Seed relational tools and high-fidelity chunks into ChromaDB
        print("\n[4/4] Ingesting all tools and rich sections into SQLite and ChromaDB...")
        
        # Emojis mapping for logo representations
        logo_map = {
            "langchain": "🦜🔗",
            "llamaindex": "🗂️",
            "chroma": "🔮",
            "ollama": "🦙",
            "pinecone": "🌲",
            "huggingface": "🤗",
            "autogen": "🤝",
            "qdrant": "🟣",
            "weaviate": "🧭",
            "crewai": "⛵",
            "lmstudio": "🎛️",
            "langsmith": "🔍"
        }

        count = 0
        for slug, item in rich_tools.items():
            cat_name = item.get("category", "AI Tools")
            
            # Ensure category exists
            cat_stmt = select(Category).filter(Category.name == cat_name)
            cat_res = await db.execute(cat_stmt)
            category = cat_res.scalars().first()
            if not category:
                category = Category(name=cat_name, description=f"Tools relating to {cat_name}")
                db.add(category)
                await db.commit()
                await db.refresh(category)

            # Insert tool
            logo = logo_map.get(slug, "🛠️")
            pricing_str = item.get("pricing", {}).get("freePlanAvailable", "Free")
            pricing_type = "Free" if pricing_str == "Yes" else "Paid/Freemium"
            
            tool = Tool(
                name=item["name"],
                slug=slug,
                description=item.get("tagline", ""),
                category_id=category.id,
                logo_url=logo,
                pricing_type=pricing_type,
                official_website=item.get("officialWebsite", "")
            )
            db.add(tool)
            await db.commit()
            await db.refresh(tool)

            # Create version history
            t_version = ToolVersion(
                tool_id=tool.id,
                version="v1.0.0",
                changelog="Initial seeding with 13-section technical specifications.",
                source_link=tool.official_website
            )
            db.add(t_version)

            # Create notification
            notification = Notification(
                title=f"Tool Registered: {tool.name}",
                message=f"Initialized '{tool.name}' dynamic data sheet successfully. Category: {cat_name}.",
                is_read=False
            )
            db.add(notification)
            await db.commit()

            # Index dynamic multi-chunk information into ChromaDB
            VectorSyncService.sync_rich_tool_vector(
                tool_name=tool.name,
                slug=slug,
                rich_data=item,
                category_name=cat_name,
                website=tool.official_website,
                pricing=pricing_type,
                version="v1.0.0"
            )
            count += 1
            print(f"Synced and indexed: {tool.name}")

        # Sync fallback/mock Hugging Face active models to keep inventory complete
        models_fallback = [
            {
                "name": "Qwen 2.5",
                "slug": "qwen-2-5",
                "description": "State-of-the-art LLM by Alibaba Group, excelling in coding, math, reasoning, and multilingual support.",
                "category_name": "AI Models",
                "logo": "👑",
                "pricing": "Free / Open-Source",
                "website": "https://github.com/QwenLM/Qwen2.5",
                "version": "v2.5.0",
                "changelog": "Added major reasoning improvements and larger context length of 128k tokens."
            },
            {
                "name": "Llama 3.3",
                "slug": "llama-3-3",
                "description": "Meta's highly versatile open-weight LLM, offering premium coding, reasoning, and agentic task execution.",
                "category_name": "AI Models",
                "logo": "🦙",
                "pricing": "Free / Open-Source",
                "website": "https://llama.meta.com",
                "version": "v3.3.0",
                "changelog": "Released state-of-the-art 70B model with superior benchmark performance."
            }
        ]

        for model in models_fallback:
            cat_name = model["category_name"]
            cat_stmt = select(Category).filter(Category.name == cat_name)
            cat_res = await db.execute(cat_stmt)
            category = cat_res.scalars().first()
            if not category:
                category = Category(name=cat_name, description=f"Tools relating to {cat_name}")
                db.add(category)
                await db.commit()
                await db.refresh(category)

            tool = Tool(
                name=model["name"],
                slug=model["slug"],
                description=model["description"],
                category_id=category.id,
                logo_url=model["logo"],
                pricing_type=model["pricing"],
                official_website=model["website"]
            )
            db.add(tool)
            await db.commit()
            await db.refresh(tool)

            t_version = ToolVersion(
                tool_id=tool.id,
                version=model["version"],
                changelog=model["changelog"],
                source_link=model["website"]
            )
            db.add(t_version)
            await db.commit()

            # Index model details into ChromaDB
            VectorSyncService.sync_tool_vector(
                tool_name=tool.name,
                slug=tool.slug,
                description=tool.description,
                category_name=cat_name,
                website=tool.official_website,
                pricing=tool.pricing_type,
                version=model["version"]
            )
            count += 1
            print(f"Synced and indexed model: {tool.name}")

        print(f"\nSeeding Completed. Total synced items: {count}")

    except Exception as e:
        print(f"\nError during seeding: {e}")
        await db.rollback()
    finally:
        await db.close()
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_clean_database())
