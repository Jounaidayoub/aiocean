# Database Schema Draft

This schema minimizes the `User` entity and focuses heavily on the core relationships between `Tool`, `Model`, and `Provider`. Because tools can use multiple models, and models can be hosted/provided by multiple companies, we use junction tables to represent those many-to-many relationships.

```mermaid
erDiagram
    %% Minimal User entity
    USER {
        uuid id PK
        string name
        string email
        string pass_hash
        string role 
        string pfp_url

    }

    PROVIDER {
        uuid id PK
        string name
        string website
        string description
    }

    MODEL {
        %% NOTE : models have names and versions like gpt-5-2026-09, but here display name and the model full name  with , but again should user reasearching for gpt 5 have all hte version should up , or onw with variants
        uuid id PK
        string name
        boolean is_open_source
        string description
        boolean reasoning
        date release_date
        date cutoff_date
        float cost_per_1m_tokens_in
        float cost_per_1m_tokens_out
        integer context_window
        integer max_output
    }

    MODEL_MODALITY {
        uuid model_id FK
        enum modality "text, image, video, audio, pdf"
        enum direction "input, output"
    }

    MODEL ||--o{ MODEL_MODALITY : "supports"

    TOOL {

        uuid id PK
        string name
        string url
        string short_description
        string pricing_model
        string logo_url
        %% status by admin  we accept useer submission but we need to review them before they go live
        enum status "active, inactive, pending"
        uuid provider_id FK "Main creator/owner"
        %% modalites tooo ?? maybe , the models have them , the tool can use multip mdoe and only expose a basic functionality
    }

    CATEGORY {
        uuid id PK
        string name
        string slug
        string description
    }

    %% Many-to-Many: Tools can have multiple Categories
    TOOL ||--o{ TOOL_CATEGORY : "categorized as"
    CATEGORY ||--o{ TOOL_CATEGORY : "includes"
    TOOL_CATEGORY {
        uuid tool_id FK
        uuid category_id FK
    }

    %% Relationships
    PROVIDER ||--o{ TOOL : "develops"

    %% Many-to-Many: Tools can use multiple Models
    TOOL ||--o{ TOOL_MODEL : "uses"
    MODEL ||--o{ TOOL_MODEL : "is used by"
    TOOL_MODEL {
        uuid tool_id FK
        uuid model_id FK
    }

    %% Many-to-Many: Models can be hosted/provided by multiple Providers (e.g., Llama 3 provided by Meta, Groq, Together AI)
    MODEL ||--o{ MODEL_PROVIDER : "hosted by"
    PROVIDER ||--o{ MODEL_PROVIDER : "provides"
    MODEL_PROVIDER {
        uuid model_id FK
        uuid provider_id FK
        string api_endpoint "Optional: provider specific endpoint"
    }

    %% Minimal User relationship for context
    USER ||--o{ TOOL : "bookmarks / reviews"
```




## Brainstorming & Open Questions

Based on the initial schema, here are the key "pressure points" and questions to address before final implementation:

### 1. The Pricing Paradox
In `TOOL`, we have `string pricing_model`.
- **The Challenge:** AI pricing is rarely a single string (Free, Pro, API usage).
- **Question:** Should we add a `PRICING_PLAN` table to allow users to filter by "Free Tier", "Usage-Based", or "Subscription"?

### 2. Model Versioning & Families
- **The Challenge:** Models like GPT-4 have many versions (`gpt-4-0613`, `gpt-4-turbo`).
- **Question:** Does a `MODEL` record represent the family (Llama 3) or a specific checkpoint? Should we add a `parent_model_id` for self-referencing hierarchy?

### 3. Provider Identity Crisis
- **The Challenge:** Anthropic *creates* Claude, but Amazon Bedrock *hosts* it.
- **Question:** Should the `PROVIDER` table distinguish between **Source Providers** (Creators) and **Service Providers** (Inference/Hosts)?

### 4. Tool-Level Modalities
- **The Challenge:** A tool might use a Multimodal model but only expose "Text to Image" to the user.
- **Question:** Should `TOOL` have its own `TOOL_MODALITY` table to track the user-facing interface?

### 5. Review & Trust (The Heart of the PRD)
- **The Challenge:** The PRD focuses on "Trust through the crowd."
- **Question:** We need a formal `REVIEW` table (Rating, Comment, Use-Case Context) to calculate the "Community Rating" and show "How people use this."

### 6. Searchability (Categories vs. Tags)
- **The Challenge:** Categories like "Productivity" are broad.
- **Question:** Should we add a `TAG` system (Many-to-Many) for more granular discovery (e.g., "summarization", "email-writer")?
