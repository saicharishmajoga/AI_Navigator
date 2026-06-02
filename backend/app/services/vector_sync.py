from langchain_core.documents import Document as LangChainDocument
from ..vectorstore.chroma_store import get_chroma_store


class VectorSyncService:
    @staticmethod
    def sync_tool_vector(
        tool_name: str,
        slug: str,
        description: str,
        category_name: str,
        website: str,
        pricing: str,
        version: str = "1.0.0"
    ) -> bool:
        """
        Synchronize a single tool's metadata and description into the ChromaDB vector store
        for semantic search retrieval.
        """
        try:
            # Build a clear, semantic representation for embedding matching
            content = (
                f"AI Tool: {tool_name}\n"
                f"Category: {category_name}\n"
                f"Description: {description}\n"
                f"Pricing Type: {pricing}\n"
                f"Current Version: {version}\n"
                f"Official Website: {website}"
            )
            
            metadata = {
                "source": website or "official_website",
                "slug": slug,
                "tool_name": tool_name,
                "version": version,
                "category": category_name,
                "pricing": pricing
            }
            
            doc = LangChainDocument(page_content=content, metadata=metadata)
            
            # Fetch store and add document
            store = get_chroma_store(collection_name="ai_navigator")
            
            # To avoid duplicates in ChromaDB, we delete existing vectors for this tool's slug first
            try:
                store._collection.delete(where={"slug": slug})
            except Exception:
                pass  # If the collection doesn't exist yet or delete fails, proceed
                
            store.add_documents([doc])
            store.persist()
            return True
        except Exception as e:
            print(f"Error syncing vector for tool {tool_name}: {e}")
            return False

    @staticmethod
    def sync_rich_tool_vector(
        tool_name: str,
        slug: str,
        rich_data: dict,
        category_name: str,
        website: str,
        pricing: str,
        version: str = "1.0.0"
    ) -> bool:
        """
        Synchronize high-fidelity detailed chunks of a tool into ChromaDB
        for precise, segmented semantic search retrieval.
        """
        try:
            store = get_chroma_store(collection_name="ai_navigator")
            
            # Delete existing vectors associated with this slug to prevent duplication
            try:
                store._collection.delete(where={"slug": slug})
            except Exception:
                pass

            documents = []

            # 1. Overview & Detailed Description
            overview_content = (
                f"AI Tool: {tool_name}\n"
                f"Category: {category_name} ({rich_data.get('subcategory', '')})\n"
                f"Tagline: {rich_data.get('tagline', '')}\n"
                f"Developer: {rich_data.get('developer', '')} (Launch Year: {rich_data.get('launchYear', 'N/A')})\n"
                f"Detailed Description: {rich_data.get('detailedDescription', '')}\n"
                f"Problem Solved: {rich_data.get('problemSolved', '')}\n"
                f"Target Audience: {rich_data.get('targetAudience', '')}"
            )
            documents.append(LangChainDocument(
                page_content=overview_content,
                metadata={
                    "source": website,
                    "slug": slug,
                    "tool_name": tool_name,
                    "version": version,
                    "category": category_name,
                    "pricing": pricing,
                    "section": "overview"
                }
            ))

            # 2. Key Technical Features
            features_list = rich_data.get('keyFeatures', [])
            if features_list:
                feat_lines = []
                for f in features_list:
                    feat_lines.append(f"- Feature: {f.get('name')}\n  Description: {f.get('description')}\n  Benefit: {f.get('benefits')}")
                features_content = f"AI Tool: {tool_name} - Key Technical Features:\n" + "\n\n".join(feat_lines)
                documents.append(LangChainDocument(
                    page_content=features_content,
                    metadata={
                        "source": website,
                        "slug": slug,
                        "tool_name": tool_name,
                        "version": version,
                        "category": category_name,
                        "pricing": pricing,
                        "section": "features"
                    }
                ))

            # 3. Role-Based Scenarios (Use Cases)
            use_cases = rich_data.get('useCases', {})
            if use_cases:
                uc_lines = []
                for k, v in use_cases.items():
                    uc_lines.append(f"- For {k.capitalize()}: {v}")
                use_cases_content = f"AI Tool: {tool_name} - Real-World Persona Scenarios & Use Cases:\n" + "\n".join(uc_lines)
                documents.append(LangChainDocument(
                    page_content=use_cases_content,
                    metadata={
                        "source": website,
                        "slug": slug,
                        "tool_name": tool_name,
                        "version": version,
                        "category": category_name,
                        "pricing": pricing,
                        "section": "use-cases"
                    }
                ))

            # 4. Technical Specs
            tech = rich_data.get('technicalDetails', {})
            if tech:
                tech_specs_content = (
                    f"AI Tool: {tool_name} - Technical Specifications & Platform Integration:\n"
                    f"Models Used: {tech.get('modelsUsed')}\n"
                    f"API Available: {tech.get('apiAvailable')}\n"
                    f"Supported Languages: {', '.join(tech.get('supportedLanguages', []))}\n"
                    f"Integrations: {', '.join(tech.get('integrations', []))}\n"
                    f"Platform Availability: {', '.join(tech.get('platformAvailability', []))}\n"
                    f"License: {tech.get('openSourceOrProprietary')}"
                )
                documents.append(LangChainDocument(
                    page_content=tech_specs_content,
                    metadata={
                        "source": website,
                        "slug": slug,
                        "tool_name": tool_name,
                        "version": version,
                        "category": category_name,
                        "pricing": pricing,
                        "section": "technical"
                    }
                ))

            # 5. Pricing Details
            pricing_details = rich_data.get('pricing', {})
            if pricing_details:
                tiers = pricing_details.get('pricingTiers', [])
                tier_lines = []
                for t in tiers:
                    tier_lines.append(f"  * Tier: {t.get('name')} - Price: {t.get('price')} - Features: {t.get('features')}")
                pricing_content = (
                    f"AI Tool: {tool_name} - Pricing Structure & Subscription Notes:\n"
                    f"Free Plan Available: {pricing_details.get('freePlanAvailable')}\n"
                    f"Free Trial Details: {pricing_details.get('freeTrialDetails')}\n"
                    f"Pricing Tiers:\n" + "\n".join(tier_lines) + "\n"
                    f"Enterprise Plan Available: {pricing_details.get('enterprisePlanAvailable')}\n"
                    f"Pricing Notes: {pricing_details.get('pricingNotes')}"
                )
                documents.append(LangChainDocument(
                    page_content=pricing_content,
                    metadata={
                        "source": website,
                        "slug": slug,
                        "tool_name": tool_name,
                        "version": version,
                        "category": category_name,
                        "pricing": pricing,
                        "section": "pricing"
                    }
                ))

            # 6. Pros & Cons
            pros_list = rich_data.get('pros', [])
            cons_list = rich_data.get('cons', [])
            if pros_list or cons_list:
                pros_str = "\n".join([f"- {p}" for p in pros_list])
                cons_str = "\n".join([f"- {c}" for c in cons_list])
                pros_cons_content = (
                    f"AI Tool: {tool_name} - Core Strengths (Pros) & Technical Limitations (Cons):\n"
                    f"Core Strengths (Pros):\n{pros_str}\n\n"
                    f"Core Limitations (Cons):\n{cons_str}"
                )
                documents.append(LangChainDocument(
                    page_content=pros_cons_content,
                    metadata={
                        "source": website,
                        "slug": slug,
                        "tool_name": tool_name,
                        "version": version,
                        "category": category_name,
                        "pricing": pricing,
                        "section": "pros-cons"
                    }
                ))

            # 7. Alternatives & Comparison
            alts_list = rich_data.get('alternatives', [])
            comp_table = rich_data.get('comparisonTable', [])
            summary = rich_data.get('summary', {})
            if alts_list or comp_table:
                alt_lines = [f"- {a.get('name')} ({a.get('category')}): {a.get('keyDifference')} - Pricing: {a.get('pricing')}" for a in alts_list]
                comp_lines = [f"- vs {row.get('competitorName')}: Ease of Use: {row.get('easeOfUse')}, Pricing: {row.get('pricing')}, API: {row.get('apiSupport')}, Best For: {row.get('bestFor')}" for row in comp_table]
                
                alt_content = (
                    f"AI Tool: {tool_name} - Market Alternatives & Competitor Comparison:\n"
                    f"Market Alternatives:\n" + "\n".join(alt_lines) + "\n\n"
                    f"Competitor Feature/Ease-of-Use Comparison:\n" + "\n".join(comp_lines) + "\n\n"
                    f"Who Should Use: {summary.get('whoShouldUse')}\n"
                    f"Who Should Avoid: {summary.get('whoShouldAvoid')}\n"
                    f"Final Verdict: {summary.get('finalVerdict')}"
                )
                documents.append(LangChainDocument(
                    page_content=alt_content,
                    metadata={
                        "source": website,
                        "slug": slug,
                        "tool_name": tool_name,
                        "version": version,
                        "category": category_name,
                        "pricing": pricing,
                        "section": "alternatives"
                    }
                ))

            store.add_documents(documents)
            store.persist()
            return True
        except Exception as e:
            print(f"Error syncing rich vector for tool {tool_name}: {e}")
            return False

