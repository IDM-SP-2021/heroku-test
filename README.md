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
    CREATE (Jill:Person {name:'Jill'})
    CREATE (Jack:Person {name:'Jack'})
    CREATE (Sam:Person {name:'Sam'})
    CREATE (John:Person {name:'John'})
    CREATE (Jane:Person {name:'Jane'})
    CREATE (Joe:Person {name:'Joe'})
    CREATE (Rob:Person {name:'Rob'})

    CREATE (Jill)-[:FAMILY {relation:'Married'}]->(Jack),
    (Jill)-[:FAMILY {relation:'Parent'}]->(Sam),
    (Jack)-[:FAMILY {relation:'Parent'}]->(Sam),
    (Jack)-[:FAMILY {relation:'Sibling'}]->(John),
    (John)-[:FAMILY {relation:'Married'}]->(Jane),
    (John)-[:FAMILY {relation:'Parent'}]->(Joe),
    (John)-[:FAMILY {relation:'Parent'}]->(Rob),
    (Jane)-[:FAMILY {relation:'Parent'}]->(Joe),
    (Jane)-[:FAMILY {relation:'Parent'}]->(Rob),
    (Joe)-[:FAMILY {relation:'Sibling'}]->(Rob)
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
