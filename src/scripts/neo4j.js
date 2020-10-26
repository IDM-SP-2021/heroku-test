var neo4j = require('neo4j-driver')
var driver = neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("neo4j", "abcde"));

function getGraph() {
  var session = driver.session();
  return session.run(
    'MATCH (s:Person)-[r]->(t:Person) \
    RETURN ID(s) AS src_id, ID(t) AS tar_id, type(r) AS rel_type'
  )
  .then(results => {
    var nodes = [], rels = [], i = 0;
    results.records.forEach(res => {
      // console.log(`${res.get('name')} is ${res.get('rel_type')} to ${res.get('rel_name')}`)

      var source = res.get('src_id').low;
      var target = res.get('tar_id').low;

      rels.push({source, target});
      console.log(rels)
    });

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