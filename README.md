# Senior Project Proof of Concept

Proof of concept app built on Heroku
Access the app (insert URL here)

## Feature Checklist

- [x] Create basic graph database in neo4j
- [x] Visualize graph DB in web view
- [ ] Visualize graph DB in tree view
- [ ] Add a person to the family tree
  - [ ] STRETCH: Automatically generate connections
- [ ] View all memories in the family
- [ ] Create a new memory

## Run Locally

1. Install Neo4j desktop
2. Create a new database
3. Start the database
4. Paste and run the following by clicking the green triangle in the upper right

    ```cypher
        CREATE (Jill:Person {name:'Jill'})
        CREATE (Jack:Person {name:'Jack'})
        CREATE (Sam:Person {name:'Sam'})
        CREATE (John:Person {name:'John'})
        CREATE (Jane:Person {name:'Jane'})
        CREATE (Joe:Person {name:'Joe'})
        CREATE (Rob:Person {name:'Rob'})

        CREATE (Jill)-[:MARRIED]->(Jack),
        (Jill)-[:PARENT]->(Sam),
        (Jack)-[:PARENT]->(Sam),
        (Jack)-[:SIBLING]->(John),
        (John)-[:MARRIED]->(Jane),
        (John)-[:PARENT]->(Joe),
        (John)-[:PARENT]->(Rob),
        (Jane)-[:PARENT]->(Joe),
        (Jane)-[:PARENT]->(Rob),
        (Joe)-[:SIBLING]->(Rob)
    ```
