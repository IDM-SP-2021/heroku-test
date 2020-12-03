const neo4j = require('neo4j-driver').v1

const neo4jHost = process.env.N4J_HOST;
const neo4jUser = process.env.N4J_USER;
const neo4jPass = process.env.N4J_PASS
let driver = neo4j.driver(neo4jHost, neo4j.auth.basic(neo4jUser, neo4jPass));

// Return all Person nodes and connections
const getGraph = () => {
  let session = driver.session();

  return Promise.all([
    session.run(
      'MATCH (p:Person) \
      RETURN ID(p) AS id, p.name AS name'
    ),
    session.run(
      'MATCH (s:Person)-[r:FAMILY]->(t:Person) \
      WHERE r.relation = "ParentTo" OR r.relation = "ChildTo" OR r.relation = "SiblingTo" OR r.relation = "SpouseTo" \
      RETURN ID(s) AS src_id, ID(t) AS tar_id, r.relation AS rel_type'
    )
  ])
  .then(results => {
    let nodes = [], rels = [], i = 0;

    // Gather names and push them to nodes array
    results[0].records.forEach(res => {
      let id = res.get('id').low;
          id = id.toString();
      let name = res.get('name');
      // console.log(id + " " + name);

      nodes.push({id, name});
    });

    // Gather relationship links and push them to rels array
    results[1].records.forEach(res => {
      let source = res.get('src_id').low;
          source = source.toString();
      let target = res.get('tar_id').low;
          target = target.toString();
      let relType = res.get('rel_type')

      rels.push({source, target, relType});
    });

    // * Uncomment the following to view a list of all people and connections in the database
    // console.log('Nodes:')
    // console.log(nodes);
    // console.log('Links:')
    // console.log(rels);

    return {nodes, links: rels};
  })
  .catch(error => {
    throw error;
  })
  .finally(() => {
    return session.close();
  })
}

// Return a list of all family members
const getFamily = () => {
  let session = driver.session();

  return session
    .run(
      'MATCH (p:Person)\
      RETURN p'
    )
    .then(results => {
      var members = [];

      results.records.forEach(res => {
        const member = res.get('p');
        const id = member.identity.low;
        const name = member.properties.name;
        const gender = member.properties.gender

        members.push({id, name, gender});
      })
      return members;
    })
    .catch(error => {
      throw error;
    })
    .finally(() => {
      return session.close();
    })
}

// Delete all data in the database and reinstance it with starting data
const resetData = () => {
  let session = driver.session()

  return Promise.all([
    session.run(
      'MATCH (p:Person)-[r]->(n:Person) \
      DELETE r'
    ),
    session.run(
      'MATCH (n) \
      DETACH DELETE n'
    ),
    session.run(
      'CREATE (Jill:Person {name: "Jill", gender: "F"}), \
              (Jack:Person {name: "Jack", gender: "M"}), \
              (John:Person {name: "John", gender: "M"}), \
              (Sam:Person {name: "Sam", gender: "M"}), \
              (Jane:Person {name: "Jane", gender: "F"}), \
              (Joe:Person {name: "Joe", gender: "M"}), \
              (Rob:Person {name: "Rob", gender: "M"}), \
              (n:MEMORY {title:"Rob\'s High School Graduation", \ date:"6-3-20", text:"Today Rob finished his high school career! He is off to college now!"}), \
              (m:MEMORY {title:"Fifteen Year Wedding Anniversary", date:"12-4-19", text:"Hard to believe it has been fifteen years already!"}), \
              (Jill)-[:FAMILY {relation: "SpouseTo"}]->(Jack), \
              (Jack)-[:FAMILY {relation: "SpouseTo"}]->(Jill), \
              (Jill)-[:FAMILY {relation: "ParentTo"}]->(Sam), \
              (Sam)-[:FAMILY {relation: "ChildTo"}]->(Jill), \
              (Jack)-[:FAMILY {relation: "ParentTo"}]->(Sam), \
              (Sam)-[:FAMILY {relation: "ChildTo"}]->(Jack), \
              (Jack)-[:FAMILY {relation: "SiblingTo"}]->(John), \
              (John)-[:FAMILY {relation: "SiblingTo"}]->(Jack), \
              (John)-[:FAMILY {relation: "SpouseTo"}]->(Jane), \
              (Jane)-[:FAMILY {relation: "SpouseTo"}]->(John), \
              (John)-[:FAMILY {relation: "ParentTo"}]->(Joe), \
              (Joe)-[:FAMILY {relation: "ChildTo"}]->(John), \
              (John)-[:FAMILY {relation: "ParentTo"}]->(Rob), \
              (Rob)-[:FAMILY {relation: "ChildTo"}]->(John), \
              (Jane)-[:FAMILY {relation: "ParentTo"}]->(Joe), \
              (Joe)-[:FAMILY {relation: "ChildTo"}]->(Jane), \
              (Jane)-[:FAMILY {relation: "ParentTo"}]->(Rob), \
              (Rob)-[:FAMILY {relation: "ChildTo"}]->(Jane), \
              (Joe)-[:FAMILY {relation: "SiblingTo"}]->(Rob), \
              (Rob)-[:FAMILY {relation: "SiblingTo"}]->(Joe), \
              (Jill)-[:FAMILY {relation:"SiblingInLawTo"}]->(John), \
              (Jill)-[:FAMILY {relation:"SiblingInLawTo"}]->(Jane), \
              (Jill)-[:FAMILY {relation:"ParsibTo"}]->(Joe), \
              (Jill)-[:FAMILY {relation:"ParsibTo"}]->(Rob), \
              (Jack)-[:FAMILY {relation:"SiblingInLawTo"}]->(Jane), \
              (Jack)-[:FAMILY {relation:"ParsibTo"}]->(Joe), \
              (Jack)-[:FAMILY {relation:"ParsibTo"}]->(Rob), \
              (Sam)-[:FAMILY {relation:"NiblingTo"}]->(John), \
              (Sam)-[:FAMILY {relation:"NiblingTo"}]->(Jane), \
              (Sam)-[:FAMILY {relation:"CousinTo"}]->(Joe), \
              (Sam)-[:FAMILY {relation:"CousinTo"}]->(Rob), \
              (John)-[:FAMILY {relation:"SiblingInLawTo"}]->(Jill), \
              (John)-[:FAMILY {relation:"ParsibTo"}]->(Sam), \
              (Jane)-[:FAMILY {relation:"SiblingInLawTo"}]->(Jill), \
              (Jane)-[:FAMILY {relation:"SiblingInLawTo"}]->(Jack), \
              (Jane)-[:FAMILY {relation:"ParsibTo"}]->(Sam), \
              (Joe)-[:FAMILY {relation:"NiblingTo"}]->(Jill), \
              (Joe)-[:FAMILY {relation:"NiblingTo"}]->(Jack), \
              (Joe)-[:FAMILY {relation:"CousinTo"}]->(Sam), \
              (Rob)-[:FAMILY {relation:"NiblingTo"}]->(Jill), \
              (Rob)-[:FAMILY {relation:"NiblingTo"}]->(Jack), \
              (Rob)-[:FAMILY {relation:"CousinTo"}]->(Sam), \
              (John)-[:TAGGED]->(n), \
              (Jane)-[:TAGGED]->(n), \
              (Rob)-[:TAGGED]->(n), \
              (Jill)-[:TAGGED]->(m), \
              (Jack)-[:TAGGED]->(m) \
              RETURN *',
    )
  ])
  .then(() => {
    console.log('Reset database');
  })
  .catch(error => {
    throw error;
  })
  .finally(() => {
    return session.close();
  })
}

// Check if node exists in database
const checkFamily = (queryString) => {
  let session = driver.session();

  return session
    .run(
      'MATCH (p:Person) \
      WHERE p.name =~ $name \
      RETURN p',
      {name: queryString}
    )
    .then(result => {
      return result.records.map(record => {
        return record.get('p');
      });
    })
    .catch(error => {
      throw error;
    })
    .finally(() => {
      return session.close();
    })
}

// Simplify multi-step relationship path to a one step relationship
const simplifyPath = (path) => {
  let simplified =
      (path == 'ChildToSpouseTo') ||
      (path == 'SiblingToChildTo')
        ? 'ChildTo' // Source is Son, Daughter, or Child to End

    : (path == 'SpouseToParentTo') ||
      (path == 'ParentToSiblingTo')
        ? 'ParentTo' // Source is Father, Mother, or Parent to End

    : (path == 'ChildToParentTo') ||
      (path == 'SiblingToSiblingTo')
        ? 'SiblingTo' // Source is Brother, Sister, or Sibling to End

    : (path == 'ChildToChildTo') ||
      (path == 'NiblingToChildTo') ||
      (path == 'SiblingToGrandchildTo')
        ? 'GrandchildTo' // Source is Grandson, Granddaughter, or Grandchild to End

    : (path == 'ParentToParentTo') ||
      (path == 'ParentToParsibTo') ||
      (path == 'GrandparentToSiblingTo')
        ? 'GrandparentTo' // Source is Grandfather, Grandmother, or Grandparent to End

    : (path == 'SpouseToSiblingTo') ||
      (path == 'SiblingToSpouseTo') ||
      (path == 'SpouseToSiblingToSpouseTo')
        ? 'SiblingInLawTo' // Source is the Brother-in-Law, Sister-in-Law, or Sibling-in-Law to End

    : (path == 'SpouseToChildTo') ||
      (path == 'SiblingInLawToChildTo')
        ? 'ChildInLawTo' // Source is Son-in-Law, Daughter-in-Law, or Child-in-Law to End

    : (path == 'ParentToSpouseTo') ||
      (path == 'ParentToSiblingInLawTo')
        ? 'ParentInLawTo' // Source is Father-in-Law, Mother-in-Law, or Parent-in-Law to End

    : (path == 'SiblingToParentTo') ||
      (path == 'SpouseToSiblingToParentTo') ||
      (path == 'SiblingInLawToParentTo') ||
      (path == 'ParsibToSiblingTo')
        ? 'ParsibTo' // Source is Uncle, Aunt, or Parsib to End

    : (path == 'ChildToSiblingTo') ||
      (path == 'ChildToSiblingToSpouseTo') ||
      (path == 'ChildToSpouseToSiblingTo') ||
      (path == 'ChildToSiblingInLawTo') ||
      (path == 'SiblingToNiblingTo')
        ? 'NiblingTo' // Source is Nephew, Niece, or Nibling to End

    : (path == 'ChildToSiblingToParentTo') ||
      (path == 'ChildToParsibTo') ||
      (path == 'NiblingToParentTo') ||
      (path == 'SiblingToCousinTo')
        ? 'CousinTo'

    : 'Unknown Relationship' // Relationship type is not defined for current path

  return simplified;
}

// Add a single node to the database and map relationships between it and all other nodes
const addFamilyMember = (queryString) => {
  let session = driver.session();

  let s = queryString.src;
  let r = queryString.rel;
  let rev = queryString.rev;
  let t = queryString.tar;
  let g = queryString.gen;

  console.log(queryString);
  console.log(`Source: ${s}`);
  console.log(`Relationship: ${r}`);
  console.log(`Target: ${t}`);

  return session
    .run(
      'CREATE (s:Person {name:$s, gender:$g}) \
       WITH s \
       MATCH (t:Person) WHERE ID(t)= $t\
       CREATE (s)-[:FAMILY {relation:$r}]->(t), \
              (t)-[:FAMILY {relation:$rev}]->(s) \
       WITH t \
       MATCH (p:Person) \
       WITH collect(p) AS nodes \
       MATCH (n:Person {name:$s}) \
       UNWIND nodes AS m \
       WITH * WHERE id(n) <> id(m) \
       MATCH path = allShortestPaths( (n)-[*..10]->(m) ) \
       MATCH revPath = allShortestPaths( (m)-[*..10]->(n) ) \
       RETURN nodes, n AS start, relationships(path) AS relationship, m AS end, relationships(revPath) AS revRelationship',
       {s:s, g:g, r:r, rev:rev, t:t}
    )
    .then(results => {
      let dirRel = [];
      let members = results.records[0].get('nodes');

      results.records.forEach(res => {
        let relPath = [];
        let revRelPath = [];
        const start = res.get('start');
        const relationship = res.get('relationship');
        const revRelationship = res.get('revRelationship');
        const end = res.get('end');

        relationship.forEach(relation => {
          relPath.push(relation.properties.relation);
        })

        revRelationship.forEach(relation => {
          revRelPath.push(relation.properties.relation);
        })

        if (relPath.length > 1) {
          simpleRel = simplifyPath(relPath.join(''))
          // console.log('Simplified: ' + simpleRel)
          if (simpleRel == 'Unknown Relationship') {
            console.log(`Complex rel ${start.properties.name} ${relPath.join('')} ${end.properties.name}`)
          } else {
            dirRel.push({start, simpleRel, end})
          }
        }

        if (revRelPath.length > 1) {
          simpleRel = simplifyPath(revRelPath.join(''))
          // console.log('Simplified: ' + simpleRel)
          if (simpleRel == 'Unknown Relationship') {
            console.log(`Complex rel ${end.properties.name} ${revRelPath.join('')} ${start.properties.name}`)
          } else {
            dirRel.push({end, simpleRel, start})
          }
        }
      })

      return [{members, dirRel}]
    })
    .catch(error => {
      throw error;
    })
    .finally(() => {
      return session.close();
    });
}

// Finds all family member nodes in graph, maps the shortest path between them, then converts the rel path to a direct relationship type
const getRelationships = () => {
  let session = driver.session()

  return session
    .run(
      'MATCH (p:Person) \
      WITH collect(p) AS nodes \
      UNWIND nodes AS n \
      UNWIND nodes AS m \
      WITH * WHERE id(n) <> id(m) \
      MATCH path = allShortestPaths( (n)-[*..10]->(m) ) \
      RETURN nodes, n AS start, relationships(path) AS relationship, m AS end'
    )
    .then(results => {
      let dirRel = [];
      let members = results.records[0].get('nodes');

      results.records.forEach(res => {
        let relPath = [];
        const start = res.get('start');
        const sName = start.name;
        const relationship = res.get('relationship');
        const end = res.get('end');
        const eName = end.name;

        relationship.forEach(relation => {
          relPath.push(relation.properties.relation)
        })
        // console.log(relPath)
        if (relPath.length > 1) {
          simpleRel = simplifyPath(relPath.join(''))
          // console.log('Simplified: ' + simpleRel)
          if (simpleRel == 'Unknown Relationship') {
            console.log(`Complex rel ${relPath.join('')}`)
          } else {
            dirRel.push({start, simpleRel, end})
          }
        }
      })

      return [{members, dirRel}]
    })
    .catch(error => {
      throw error;
    })
    .finally(() => {
      return session.close();
    })
}

// Take relationships from getRelationships and create database relationships
const submitQuery = (query) => {
  let session = driver.session();

  return session
    .run(query)
    .then(() => {
      console.log('Query submitted successfully')
    })
    .catch(error => {
      throw error;
    })
    .finally(() => {
      return session.close();
    })
}

exports.getGraph = getGraph;
exports.getFamily = getFamily;
exports.checkFamily = checkFamily;
exports.addFamilyMember = addFamilyMember;
exports.resetData = resetData;
exports.getRelationships = getRelationships;
exports.submitQuery = submitQuery;