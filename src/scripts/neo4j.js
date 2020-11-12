var neo4j = require('neo4j-driver').v1

const neo4jHost = process.env.N4J_HOST;
const neo4jUser = process.env.N4J_USER;
const neo4jPass = process.env.N4J_PASS
var driver = neo4j.driver(neo4jHost, neo4j.auth.basic(neo4jUser, neo4jPass));

// Return all Person nodes and connections
const getGraph = () => {
  var session = driver.session();

  return Promise.all([
    session.run(
      'MATCH (p:Person) \
      RETURN ID(p) AS id, p.name AS name'
    ),
    session.run(
      'MATCH (s:Person)-[r]->(t:Person) \
      RETURN ID(s) AS src_id, ID(t) AS tar_id, type(r) AS rel_type'
    )
  ])
  .then(results => {
    var nodes = [], rels = [], i = 0;

    // Gather names and push them to nodes array
    results[0].records.forEach(res => {
      var id = res.get('id').low;
          id = id.toString();
      var name = res.get('name');
      // console.log(id + " " + name);

      nodes.push({id, name});
    });

    // Gather relationship links and push them to rels array
    results[1].records.forEach(res => {
      var source = res.get('src_id').low;
          source = source.toString();
      var target = res.get('tar_id').low;
          target = target.toString();

      rels.push({source, target});
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
  var session = driver.session();

  return session
    .run(
      'MATCH (p:Person)\
      RETURN ID(p) AS id, p.name AS name'
    )
    .then(results => {
      var members = [];

      results.records.forEach(res => {
        var id = res.get('id').low;
        var name = res.get('name');

        members.push({id, name});
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
  var session = driver.session();

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
  const session = driver.session();

  let s = queryString[0].s;
  let r = queryString[0].r;
  let t = queryString[0].t;
  let n = queryString[0].n;

  console.log(`${queryString}`);
  console.log(`Source: ${s}`);
  console.log(`Relationship: ${r}`);
  console.log(`Target: ${t}`);

  return session
    .run(
      'CREATE (n:Person {name:$n}) \
       WITH n \
       MATCH (s:Person {name:$s}), \
             (t:Person {name:$t}) \
       CREATE (s)-[rel:FAMILY {relation:$r}]->(t) \
       RETURN s.name AS sName, rel.relation AS relation, t.name AS tName',
       {n:n, s:s, r:r, t:t}
    )
    .then(result => {
      console.log(result);
    })
    .catch(error => {
      throw error;
    })
    .finally(() => {
      return session.close();
    });
}

const resetData = () => {
  var session = driver.session()

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
        Married: 'Married',
        Parent: 'Parent',
        Child: 'Child',
        Sibling: 'Sibling',
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

const getRelationships = () => {
  var session = driver.session()

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

        let newRel = (rel == 'Child') ? 'Child'
                   : (rel == 'Married') ? 'Married'
                   : (rel == 'Parent') ? 'Parent'
                   : (rel == 'Sibling') ? 'Sibling'
                   : (rel == 'SiblingMarried' && end.gender == 'M') ? 'BroterInLaw'
                   : (rel == 'MarriedSibling' && end.gender == 'M') ? 'BrotherInLaw'
                   : (rel == 'MarriedSiblingMarried' && end.gender == 'M') ? 'BrotherInLaw'
                   : (rel == 'SiblingMarried' && end.gender == 'F') ? 'SisterInLaw'
                   : (rel == 'MarriedSibling' && end.gender == 'F') ? 'SisterInLaw'
                   : (rel == 'MarriedSiblingMarried' && end.gender == 'F') ? 'SisterInLaw'
                   : (rel == 'SiblingParent' && end.gender == 'M') ? 'Nephew'
                   : (rel == 'MarriedSiblingParent' && end.gender == 'M') ? 'Nephew'
                   : (rel == 'SiblingParent' && end.gender == 'F') ? 'Neice'
                   : (rel == 'MarriedSiblingParent' && end.gender == 'F') ? 'Neice'
                   : (rel == 'ChildSibling' && end.gender == 'M') ? 'Uncle'
                   : (rel == 'ChildSiblingMarried' && end.gender == 'M') ? 'Uncle'
                   : (rel == 'ChildSibling' && end.gender == 'F') ? 'Aunt'
                   : (rel == 'ChildSiblingMarried' && end.gender == 'F') ? 'Aunt'
                   : (rel == 'ChildSiblingParent') ? 'Cousin'
                   : 'Unknown Relationship'

        console.log(sName + " " + newRel + " " + eName)

        dirRel.push({sName, newRel, eName})
      })
      console.log(dirRel)
      return dirRel
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