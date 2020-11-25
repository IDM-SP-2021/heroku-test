# Senior Project Proof of Concept

Proof of concept app built on Heroku
Access the app (insert URL here)

## Feature Checklist

- [x] Create basic graph database in neo4j
- [x] Visualize graph DB in web view
- [ ] Visualize graph DB in tree view
- [X] Add a person to the family tree
  - [ ] STRETCH: Automatically generate connections
- [ ] View all memories in the family
- [ ] Create a new memory

## Setup

1. Clone repo

  ```bash
  git clone https://github.com/IDM-SP-2021/heroku-test.git
  ```

2. Install dependencies

  ```bash
  npm install
  ```

3. Setup your local Neo4J database
   1. Install [Neo4j Desktop](https://neo4j.com/download/)
   2. Create a blank database
      1. Database name is just for your reference, it can be whatever you want (Rec: 'Family Tree' or 'Heroku Test')
      2. Set whatever password you want, make sure to note it as you will need it later
   3. Start the database
   4. Open the database with 'Neo4J Browser' (this is the default open option)
   5. Run the following cypher command

    ```cypher
   CREATE (Jill:Person {name: 'Jill', gender: 'F'}),
   (Jack:Person {name: 'Jack', gender: 'M'}),
   (Sam:Person {name: 'Sam', gender: 'M'}),
   (John:Person {name: 'John', gender: 'M'}),
   (Jane:Person {name: 'Jane', gender: 'F'}),
   (Joe:Person {name: 'Joe', gender: 'M'}),
   (Rob:Person {name: 'Rob', gender: 'M'}),
   (Jill)-[:FAMILY {relation: 'SpouseTo'}]->(Jack),
   (Jack)-[:FAMILY {relation: 'SpouseTo'}]->(Jill),
   (Jill)-[:FAMILY {relation: 'ParentTo'}]->(Sam),
   (Sam)-[:FAMILY {relation: 'ChildTo'}]->(Jill),
   (Jack)-[:FAMILY {relation: 'ParentTo'}]->(Sam),
   (Sam)-[:FAMILY {relation: 'ChildTo'}]->(Jack),
   (Jack)-[:FAMILY {relation: 'SiblingTo'}]->(John),
   (John)-[:FAMILY {relation: 'SiblingTo'}]->(Jack),
   (John)-[:FAMILY {relation: 'SpouseTo'}]->(Jane),
   (Jane)-[:FAMILY {relation: 'SpouseTo'}]->(John),
   (John)-[:FAMILY {relation: 'ParentTo'}]->(Joe),
   (Joe)-[:FAMILY {relation: 'ChildTo'}]->(John),
   (John)-[:FAMILY {relation: 'ParentTo'}]->(Rob),
   (Rob)-[:FAMILY {relation: 'ChildTo'}]->(John),
   (Jane)-[:FAMILY {relation: 'ParentTo'}]->(Joe),
   (Joe)-[:FAMILY {relation: 'ChildTo'}]->(Jane),
   (Jane)-[:FAMILY {relation: 'ParentTo'}]->(Rob),
   (Rob)-[:FAMILY {relation: 'ChildTo'}]->(Jane),
   (Joe)-[:FAMILY {relation: 'SiblingTo'}]->(Rob),
   (Rob)-[:FAMILY {relation: 'SiblingTo'}]->(Joe)
    ```

   6. To check that the databse has been setup correctly run the following cypher command. This will return 7 nodes and 10 connections

   ```cypher
   MATCH (p:Person) RETURN p
   ```

4. Create a `.env` file in the root directory of the project
   1. Set `N4J_HOST` to your Bolt port (default is `bolt://localhost:7687`)
      1. To check your port return to the main Neo4J Desktop window, in the widget for your project database click the three dots and select 'Manage'. The Bolt port is listed near the botoom of the page.
   2. Set `N4J_USER` to your database user (default is `neo4j`)
      1. This can be changed, but requires additional configuration not covered here
   3. Set `N4J_PASS` to your database user password (this is whatever you set when you created the database)

   ```system
   // Example .env file
   N4J_HOST=bolt://localhost:7687
   N4j_USER=neo4j
   N4J_PASS=password
   ```

## Running Locally

1. Ensure your local Neo4J server is running
2. To open the project in a local development server, run

  ```bash
  npm start
  ```

3. To build the project, run

  ```bash
  npm run build
  ```

## Helpful CYPHER queries

Return all the shortest paths between all the nodes. This will be used to find how individuals are related to generate new relationships.

   ```cypher
   MATCH (p:Person)
   WITH collect(p) AS nodes
   UNWIND nodes as n
   UNWIND nodes as m
   WITH * WHERE id(n) <> id(m)
   MATCH path = allShortestPaths( (n)-[*..4]-(m) )
   RETURN path
   ```
