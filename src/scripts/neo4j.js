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
       RETURN n AS start, relationships(path) AS relationship, m AS end, relationships(revPath) AS revRelationship',
       {s:s, g:g, r:r, rev:rev, t:t}
    )
    .then(results => {
      results.records.forEach(res => {
        console.log(res);
      })
    })
    .catch(error => {
      throw error;
    })
    .finally(() => {
      return session.close();
    });
}

const resetData = () => {
  let session = driver.session()

  return Promise.all([
    session.run(
      'MATCH (p:Person)-[r]->(n:Person) \
      DELETE r'
    ),
    session.run(
      'MATCH (p:Person) \
      DELETE p'
    ),
    session.run(
      'CREATE (Jill:Person {name:$Jill, gender:$F}), \
              (Jack:Person {name:$Jack, gender:$M}), \
              (Sam:Person {name:$Sam, gender:$M}), \
              (John:Person {name:$John, gender:$M}), \
              (Jane:Person {name:$Jane, gender:$F}), \
              (Joe:Person {name:$Joe, gender:$M}), \
              (Rob:Person {name:$Rob, gender:$M}), \
              (Jill)-[:FAMILY {relation:$Married}]->(Jack), \
              (Jack)-[:FAMILY {relation:$Married}]->(Jill), \
              (Jill)-[:FAMILY {relation:$Parent}]->(Sam), \
              (Sam)-[:FAMILY {relation:$Child}]->(Jill), \
              (Jack)-[:FAMILY {relation:$Parent}]->(Sam), \
              (Sam)-[:FAMILY {relation:$Child}]->(Jack), \
              (Jack)-[:FAMILY {relation:$Sibling}]->(John), \
              (John)-[:FAMILY {relation:$Sibling}]->(Jack), \
              (John)-[:FAMILY {relation:$Married}]->(Jane), \
              (Jane)-[:FAMILY {relation:$Married}]->(John), \
              (John)-[:FAMILY {relation:$Parent}]->(Joe), \
              (Joe)-[:FAMILY {relation:$Child}]->(John), \
              (John)-[:FAMILY {relation:$Parent}]->(Rob), \
              (Rob)-[:FAMILY {relation:$Child}]->(John), \
              (Jane)-[:FAMILY {relation:$Parent}]->(Joe), \
              (Joe)-[:FAMILY {relation:$Child}]->(Jane), \
              (Jane)-[:FAMILY {relation:$Parent}]->(Rob), \
              (Rob)-[:FAMILY {relation:$Child}]->(Jane), \
              (Joe)-[:FAMILY {relation:$Sibling}]->(Rob), \
              (Rob)-[:FAMILY {relation:$Sibling}]->(Joe)',
      {
        Jill: 'Jill',
        Jack: 'Jack',
        Sam: 'Sam',
        John: 'John',
        Jane: 'Jane',
        Joe: 'Joe',
        Rob: 'Rob',
        Married: 'SpouseTo',
        Parent: 'ParentTo',
        Child: 'ChildTo',
        Sibling: 'SiblingTo',
        M: 'M',
        F: 'F'
      }
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

const testData = (query) => {
  let data = []
  let session = driver.session();
  console.log('Started query')
  return session
    .run(query)
    .then(results => {
      console.log(results.records)
    })
    .catch(error => {
      throw error;
    })
    .finally(() => {
      return session.close();
    })
};

const simplifyPath = (path) => {
  let simplified =
      (path == 'SpouseToSiblingTo') ||
      (path == 'SiblingToSpouseTo') ||
      (path == 'SpouseToSiblingToSpouseTo')
        ? 'SiblingInLawTo' // Source is the Brother-in-Law, Sister-in-Law, or Sibling-in-Law to End

    : (path == 'SiblingToParentTo') ||
      (path == 'SpouseToSiblingToParentTo')
        ? 'ParsibTo' // Source is Uncle, Aunt, or Parsib to End

    : (path == 'ChildToSiblingTo') ||
      (path == 'ChildToSiblingToSpouseTo')
        ? 'NiblingTo' // Source is Nephew, Niece, or Nibling to End

    : (path == 'ChildToSiblingToParentTo')
        ? 'CousinTo'

    : 'Unknown Relationship' // Relationship type is not defined for current path

  return simplified;
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
          }
          dirRel.push({start, simpleRel, end})
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
const makeRelationships = (rel) => {
  let session = driver.session();
  console.log(rel)
  let start = rel.sName;
  let relation = rel.newRel;
  let end = rel.eName;
  console.log(`${start} ${relation} ${end}`)

  return session
    .run(
      'MATCH (s:Person {name:$start}), (t:Person {name:$end}) \
      MERGE (s)-[:FAMILY {relation:$relation}]->(t) \
      RETURN s.name AS sName, t.name AS tName',
      {
        start:start,
        end:end,
        relation:relation
      }
    )
    .then(results => {
      results.records.forEach(res => {
        console.log(res);
      })
    })
    .catch(error => {
      throw error;
    })
    .finally(() => {
      return session.close();
    })

  // return rels.forEach(rel => {

  //   // Uncomment the following to see what relationships are being added

  //   session.run(
  //     'MATCH (s:Person {name:$start}), (t:Person {name:$end}) \
  //     MERGE (s)-[:FAMILY {relation:$relation}]->(t) \
  //     RETURN s.name AS sName, t.name AS tName',
  //     {
  //       start:start,
  //       end:end,
  //       relation:relation
  //     }
  //   )
  //   .then(results => {
  //     results.records.forEach(res => {
  //       let sName = res.get('sName');
  //       let tName = res.get('tName');
  //     })
  //   })
  //   .catch(error => {
  //     throw error;
  //   })
  //   .finally(() => {
  //     return session.close();
  //   })
  // })
}

exports.getGraph = getGraph;
exports.getFamily = getFamily;
exports.checkFamily = checkFamily;
exports.addFamilyMember = addFamilyMember;
exports.resetData = resetData;
exports.testData = testData;
exports.getRelationships = getRelationships;
exports.makeRelationships = makeRelationships;