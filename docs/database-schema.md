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
        uuid provider_id FK "Main creator/owner"
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
