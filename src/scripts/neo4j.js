var neo4j = require('neo4j-driver')
var driver = neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("neo4j", "abcde"));

function getGraph() {
  var session = driver.session();
  return session.run(
    'MATCH (p:Person)-[r]->(a:Person) \
    RETURN p.name AS name, collect(a.name) AS rel_name, type(r) AS rel_type'
  )
  .then(results => {
    var nodes = [], rels = [], i = 0;
    results.records.forEach(res => {
      // console.log(res.get('name'));
      nodes.push({title: res.get('name'), label: 'Person'});
      var target = i;
      i++;

      res.get('rel_name').forEach(name => {
        var rel = {title: name, label: 'Person'};
        var source = _.findIndex(nodes, rel);
        if (source === -1) {
          nodes.push(rel);
          source = i;
          i++;
        }
        rels.push({source, target});
      })
    });

    console.log('nodes: ', nodes);
    console.log('relationships: ', rels);

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