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
      'MATCH (s:Person)-[r]->(t:Person) \
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

  let s = queryString[0];
  let r = queryString[1];
  let rev = queryString[2];
  let t = queryString[3];
  let g = queryString[4];

  console.log(queryString);
  console.log(`Source: ${s}`);
  console.log(`Relationship: ${r}`);
  console.log(`Target: ${t}`);

  return session
    .run(
      'MERGE (n:Person {name:$s, gender:$g}) \
       WITH n \
       MATCH (s:Person {name:$s}), \
             (t:Person {name:$t}) \
       CREATE (s)-[rel:FAMILY {relation:$r}]->(t), \
              (t)-[revRel:FAMILY {relation:$rev}]->(s) \
       RETURN s.name AS sName, rel.relation AS relation, revRel.relation AS revRelation, t.name AS tName',
       {s:s, g:g, r:r, rev:rev, t:t}
    )
    .then(result => {
      console.log(result.records);
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
      RETURN n AS start, relationships(path) AS relationship, m AS end'
    )
    .then(results => {
      let dirRel = [];
      let unknowns = [];

      results.records.forEach(res => {
        let relPath = [];
        const start = res.get('start').properties;
        const sName = start.name;
        const relationship = res.get('relationship');
        const end = res.get('end').properties;
        const eName = end.name;

        for (i = 0; i < relationship.length; i++) {
          relPath.push(relationship[i].properties.relation);
          rel = relPath.join('');
        }

        // Convert rel path to direct relationship. All relationships are written in Source to Target format. Unknown path variants return Unknown Relationship
        let newRel =
            (rel == 'ChildTo') ||
            (rel == 'SiblingToChildTo') ||
            (rel == 'SiblingToSiblingToChildTo')
              ? 'ChildTo' //Source is Son, Daughter, or Child to End

          : (rel == 'SpouseTo') ||
            (rel == 'ParentToChildTo') ||
            (rel == 'ParentToSiblingToChildTo')
              ? 'SpouseTo' // Source is Husband, Wife, or Spouse to End

          : (rel == 'ParentTo') ||
            (rel == 'ParentToSiblingTo') ||
            (rel == 'ParentToSiblingToSiblingTo') ||
            (rel == 'SpouseToParentTo')
              ? 'ParentTo' // Mother, Father, or Parent To End

          : (rel == 'SiblingToChildToChildTo') ||
            (rel == 'SiblingToChildToSiblingToChildTo')
              ? 'GrandchildTo' // Source is Grandson, Granddaughter, or Grandchild to End

          : (rel == 'ParentToParentTo') ||
            (rel == 'ParentToSpouseToParentTo') ||
            (rel == 'ParentToParentToSiblingTo') ||
            (rel == 'ParentToSiblingToParentToSiblingTo') ||
            (rel == 'ParentToSiblingToParentTo') ||
            (rel == 'ParentToSiblingToSpouseToParentTo')
              ? 'GrandparentTo' // Source is Grandfather, Grandmother, or Grandparent to End

          : (rel == 'ParentToParentToParentTo') ||
            (rel == 'ParentToSiblingToParentToParentTo')
              ? 'GreatGrandparentTo' // Source is Great Grandfather, Great Grandmother, or Great Grandparent to End

          : (rel == 'SiblingTo') ||
            (rel == 'SiblingToSiblingTo') ||
            (rel == 'SiblingToSiblingToSiblingTo') ||
            (rel == 'SiblingToChildToParentTo')
              ? 'SiblingTo' // Source is Brother, Sister, or Sibling to End

          : (rel == 'SpouseToChildTo')
              ? 'ChildInLawTo' // Source is Son-in-Law, Daughter-in-Law, or Child-in-Law to End

          : (rel == 'ParentToSpouseToChildTo') ||
            (rel == 'ParentToSiblingToSpouseToChildTo')
              ? 'ChildParentInLawTo' // Source is the Parent-in-Law to End's Child

          : (rel == 'SiblingToSpouseTo') ||
            (rel == 'SpouseToSiblingTo') ||
            (rel == 'SpouseToSiblingToSiblingTo') ||
            (rel == 'SpouseToSiblingToSpouseTo') ||
            (rel == 'SpouseToSiblingToParentToChildTo')
              ? 'SiblingInLawTo' // Source is Brother-in-Law, Sister-in-Law, or Sibling-in-Law to End

          : (rel == 'SpouseToSiblingToSpouseToSiblingTo')
              ? 'SiblingInLawSiblingTo' // Source is Brother-in-Law's Sibling, Sister-in-Law's Sibling, or Sibling-in-Law's Sibling To End

          : (rel == 'SpouseToSiblingToSpouseToChildTo') ||
            (rel == 'SiblingToSpouseToChildTo')
              ? 'SiblingInLawParentTo' // Source is Brother-in-Law's Parent, Sister-in-Law's Parent, or Sibling-in-Law's Parent To End

          : (rel == 'ParentToSpouseTo') ||
            (rel == 'ParentToSpouseToSpouseTo') ||
            (rel == 'ParentToSiblingToParentToChildTo') ||
            (rel == 'ParentToSiblingToSpouseTo')
              ? 'ParentInLawTo' // Source is Father-in-Law, Mother-in-Law, or Parent-in-Law to End

          : (rel == 'ParentToSpouseToSiblingTo') ||
            (rel == 'ParentToSiblingToSpouseToSiblingTo')
              ? 'SiblingParentInLawTo' // Source is Parent-in-Law to End's Sibling

          : (rel == 'ParentToParentToSpouseTo') ||
            (rel == 'ParentToParentToChildTo') ||
            (rel == 'ParentToSiblingToParentToSpouseTo')
              ? 'GrandparentInLawTo' // Source is Grandfather-in-Law, Grandmother-in-Law, or Grandparent-in-Law to End (End's Spouse's Grandparent)

          : (rel == 'SiblingToParentTo') ||
            (rel == 'SiblingToSpouseToParentTo') ||
            (rel == 'SiblingToSiblingToParentTo') ||
            (rel == 'SpouseToSiblingToParentTo') ||
            (rel == 'SpouseToSiblingToSpouseToParentTo') ||
            (rel == 'SpouseToSiblingToParentToSiblingTo')
              ? 'ParsibTo' // Source is Uncle, Aunt, or Parent's Sibling To End

          : (rel == 'SpouseToSiblingToParentToParentTo')
              ? 'GrandNiblingTo' // Source is Niece's/Nephew's/Nibling's Son, Daugher, or Child To End

          : (rel == 'ChildToSibling') ||
            (rel == 'ChildToSiblingToMarried') ||
            (rel == 'SiblingToChildToSiblingTo') ||
            (rel == 'SiblingToChildToSiblingToSiblingTo') ||
            (rel == 'SiblingToChildToSiblingToParentToChildTo')
              ? 'NiblingTo' // Source is Niece, Nephew, or Nibling To End

          : (rel == 'SiblingToChildToSiblingToSpouseToSiblingTo')
              ? 'SiblingNiblingTo' // Source is Nibling of End's Sibling

          : (rel == 'SiblingToChildToSiblingToSpouseToChildTo')
              ? 'ParsibParentTo' // Source is Uncle's, Aunt's, or Parsib's (by marriage) Parent To End

          : (rel == 'ChildSiblingParent') ||
            (rel == 'SiblingToChildToSiblingToParentTo') ||
            (rel == 'SiblingToChildToSiblingToParentToSiblingTo') ||
            (rel == 'SiblingToChildToSiblingToSpouseToParentTo')
              ? 'CousinTo' // Source is Cousin To End

          : (rel == 'SiblingToChildToSiblingToParentToParentTo')
              ? 'FirstCousinOnceRemTo' // Source is First Cousin Once Removed To End (Cousin's Child or Grandparsib's Child)

          : 'Unknown Relationship' // Relationship type is not defined for current path

        if (newRel == 'Unknown Relationship') {
          // console.log(`${sName} ${rel} ${eName}`);
          unknowns.push(newRel)
        }
        dirRel.push({sName, newRel, eName})
        return unknowns
      })
      // console.log(unknowns);
      // console.log(dirRel);
      return dirRel
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