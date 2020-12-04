# Senior Project Proof of Concept

## About

Proof of concept application to demonstrate technical feasibility of creating a social network application for families using Neo4j.

[Access the live app demo](https://idm-sp-poc.herokuapp.com/)

Neo4j is an open source graph database software. [Learn more](https://neo4j.com/)

This proof of concept renders the data of family members in an interactable diagram. Additionally, users can interact with the database by either adding a new family member or new member using the respective forms.

## Feature Checklist

- [x] Create basic graph database in neo4j
- [x] Visualize graph DB in web view
- [ ] Visualize graph DB in tree view
- [X] Add a person to the family tree
  - [X] STRETCH: Automatically generate connections
- [X] View all memories in the family
- [X] Create a new memory

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
   (n:Memory {title:"Rob's High School Graduation", date:'6-3-20', text:'Today Rob finished his high school career! He is off to college now!'}),
   (m:Memory {title:"Fifteen Year Wedding Anniversary", date:'12-4-19', text:'Hard to believe it has been fifteen years already!'})
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
   (Rob)-[:FAMILY {relation: 'SiblingTo'}]->(Joe),
   (Jill)-[:FAMILY {relation:'SiblingInLawTo'}]->(John),
   (Jill)-[:FAMILY {relation:'SiblingInLawTo'}]->(Jane),
   (Jill)-[:FAMILY {relation:'ParsibTo'}]->(Joe),
   (Jill)-[:FAMILY {relation:'ParsibTo'}]->(Rob),
   (Jack)-[:FAMILY {relation:'SiblingInLawTo'}]->(Jane),
   (Jack)-[:FAMILY {relation:'ParsibTo'}]->(Joe),
   (Jack)-[:FAMILY {relation:'ParsibTo'}]->(Rob),
   (Sam)-[:FAMILY {relation:'NiblingTo'}]->(John),
   (Sam)-[:FAMILY {relation:'NiblingTo'}]->(Jane),
   (Sam)-[:FAMILY {relation:'CousinTo'}]->(Joe),
   (Sam)-[:FAMILY {relation:'CousinTo'}]->(Rob),
   (John)-[:FAMILY {relation:'SiblingInLawTo'}]->(Jill),
   (John)-[:FAMILY {relation:'ParsibTo'}]->(Sam),
   (Jane)-[:FAMILY {relation:'SiblingInLawTo'}]->(Jill),
   (Jane)-[:FAMILY {relation:'SiblingInLawTo'}]->(Jack),
   (Jane)-[:FAMILY {relation:'ParsibTo'}]->(Sam),
   (Joe)-[:FAMILY {relation:'NiblingTo'}]->(Jill),
   (Joe)-[:FAMILY {relation:'NiblingTo'}]->(Jack),
   (Joe)-[:FAMILY {relation:'CousinTo'}]->(Sam),
   (Rob)-[:FAMILY {relation:'NiblingTo'}]->(Jill),
   (Rob)-[:FAMILY {relation:'NiblingTo'}]->(Jack),
   (Rob)-[:FAMILY {relation:'CousinTo'}]->(Sam),
   (John)-[:TAGGED]->(n),
   (Jane)-[:TAGGED]->(n),
   (Rob)-[:TAGGED]->(n),
   (Jill)-[:TAGGED]->(m),
   (Jack)-[:TAGGED]->(m)
   RETURN *
    ```

   1. To check that the databse has been setup correctly run the following cypher command. This will return 7 nodes and 10 connections

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

Return all nodes and relationships in the database.

   ```cypher
   MATCH (n) RETURN n
   ```

Return only the people and their relationships to each other in the database.

   ```cypher
   MATCH (p:Person) RETURN p
   ```

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

## How to Use

### The Family Diagram

- Click and drag on the blank canvas to pan
- Scroll on blank canvas to zoom
- Click and drag a node to move it around the canvas

### Add a Family Member Form

- Name the new family member
- Select their gender (Male, Female, or Non-Binary)
- Select their relationship to a family member currently in the database
- Select the family member currently in the database
- On submission the new family member will be added to the database, the diagram as well as any lists of the family members will all refresh

### Add a Memory Form

- Give the new memory a title
- Select a date that this memory happened
- Add a text description for the memory
- Select one or more family members
- On submission the memory list will refresh
