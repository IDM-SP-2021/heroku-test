var neo4j = require('neo4j-driver').v1
var driver = neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("neo4j", "abcde"));

function getGraph() {
  var session = driver.session();

  return Promise.all([
    session.run(
      'MATCH (p:Person) \
      RETURN p.name AS name'
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
      var id = res.get('name');

      nodes.push({id});
    });

    // Gather relationship links and push them to rels array
    results[1].records.forEach(res => {
      var source = res.get('src_id').low;
      var target = res.get('tar_id').low;

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

exports.getGraph = getGraph;