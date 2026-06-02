import json
from pathlib import Path
from sqlalchemy import select
from ..models.tool import Tool
from ..models.category import Category

async def seed_database_on_startup(db):
    try:
        json_path = Path(__file__).parent.parent / "vectorstore" / "tool_details.json"
        if not json_path.exists():
            print(f"[AUTO-SEED] tool_details.json not found at {json_path}")
            return

        with open(json_path, "r", encoding="utf-8") as f:
            rich_tools = json.load(f)

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

        print(f"[AUTO-SEED] Seeding {len(rich_tools)} tools into database...")
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

            # Insert tool if missing
            tool_stmt = select(Tool).filter(Tool.slug == slug)
            tool_res = await db.execute(tool_stmt)
            tool = tool_res.scalars().first()
            if not tool:
                pricing_info = item.get("pricing", {})
                free_plan = pricing_info.get("freePlanAvailable", "No")
                pricing_str = "Free" if free_plan.lower() == "yes" else "Proprietary"
                
                logo = logo_map.get(slug, "🛠️")
                
                tool = Tool(
                    name=item.get("name", slug.capitalize()),
                    slug=slug,
                    description=item.get("tagline", ""),
                    category_id=category.id,
                    logo_url=logo,
                    pricing_type=pricing_str,
                    official_website=item.get("officialWebsite", "")
                )
                db.add(tool)
        
        await db.commit()
        print("[AUTO-SEED] Database seeded successfully!")
    except Exception as e:
        print(f"[AUTO-SEED] Error seeding database: {e}")
