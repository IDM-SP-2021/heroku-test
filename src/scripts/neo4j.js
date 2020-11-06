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
      console.log(id + " " + name);

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
    console.log('Nodes:')
    console.log(nodes);
    console.log('Links:')
    console.log(rels);

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

      console.log(members);

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
      'CREATE (Jill:Person {name:$Jill}), \
              (Jack:Person {name:$Jack}), \
              (Sam:Person {name:$Sam}), \
              (John:Person {name:$John}), \
              (Jane:Person {name:$Jane}), \
              (Joe:Person {name:$Joe}), \
              (Rob:Person {name:$Rob}), \
              (Jill)-[:FAMILY {relation:$Married}]->(Jack), \
              (Jill)-[:FAMILY {relation:$Parent}]->(Sam), \
              (Jack)-[:FAMILY {relation:$Parent}]->(Sam), \
              (Jack)-[:FAMILY {relation:$Sibling}]->(John), \
              (John)-[:FAMILY {relation:$Married}]->(Jane), \
              (John)-[:FAMILY {relation:$Parent}]->(Joe), \
              (John)-[:FAMILY {relation:$Parent}]->(Rob), \
              (Jane)-[:FAMILY {relation:$Parent}]->(Joe), \
              (Jane)-[:FAMILY {relation:$Parent}]->(Rob), \
              (Joe)-[:FAMILY {relation:$Sibling}]->(Rob)',
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
        Sibling: 'Sibling'
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

exports.getGraph = getGraph;
exports.getFamily = getFamily;
exports.checkFamily = checkFamily;
exports.addFamilyMember = addFamilyMember;
exports.resetData = resetData;