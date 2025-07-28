// Sample Mermaid diagrams that can be converted to Excalidraw
export const sampleMermaidDiagrams = {
  flowchart: `flowchart TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> E[Fix issues]
    E --> B
    C --> F[Deploy]
    F --> G[End]`,

  sequenceDiagram: `sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Database
    
    User->>Frontend: Click button
    Frontend->>Backend: API Request
    Backend->>Database: Query data
    Database-->>Backend: Return results
    Backend-->>Frontend: JSON response
    Frontend-->>User: Display results`,

  classDiagram: `classDiagram
    class Animal {
      +String name
      +int age
      +void eat()
      +void sleep()
    }
    
    class Dog {
      +String breed
      +void bark()
    }
    
    class Cat {
      +String color
      +void meow()
    }
    
    Animal <|-- Dog
    Animal <|-- Cat`,

  stateDiagram: `stateDiagram-v2
    [*] --> Idle
    Idle --> Processing : Start
    Processing --> Success : Complete
    Processing --> Error : Fail
    Success --> [*]
    Error --> Idle : Retry
    Error --> [*] : Give up`,

  erDiagram: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    CUSTOMER {
        string name
        string email
        string phone
    }
    ORDER ||--|{ LINE-ITEM : contains
    ORDER {
        int orderNumber
        date orderDate
        string status
    }
    LINE-ITEM {
        int quantity
        float price
    }
    PRODUCT ||--o{ LINE-ITEM : includes
    PRODUCT {
        string name
        string sku
        float price
    }`
};