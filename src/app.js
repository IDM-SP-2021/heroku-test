import { makeArray } from 'jquery';
import './css/styles.css';
var $ = require('jquery');
const d3 = require('d3');
import { customAlphabet } from 'nanoid'

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 5)

var api = require('./scripts/neo4j')

$(function () {
  renderGraph();
  makeList();

  $('#add-member').on('submit', (e) => {
    e.preventDefault();
    const m = $('#current-members').val();
    const r = $('#relationship').val();
    const n = $.trim($('#new-name').val());
    const g = $('#gender').val();

    addMember(m, r, n, g);
  })

  const reset = $('#reset button');
  reset.on('click', () => {
    if (confirm('Are you sure you want to reset the graph data? This cannot be undone.')) {
      // Reset data
      console.log('Reset data');
      api
        .resetData()
        .then(() => {
          $('.member').remove();
          $('#graph svg').remove();
          $('#current-members option').remove();
        })
        .then(() => {
          renderGraph();
          makeList();
        })
    } else {
      // Do nothing
      console.log('Do not reset data');
    }
  });

  const makeRels = $('#make-rels button');
  makeRels.on('click', genRels);

  const testData = $('#test-data button');
  testData.on('click', genData);


});

const genData = () => {
  console.log('Generating Test Data');

  api
    .getFamily()
    .then(family => {
      let newRels = [];
      let match = ''
      let create = 'CREATE '
      let merge = ''
      // let mergeR = ''
      family.forEach((i, idx, array) => {
        const genOpt = ['M', 'F', 'X']
        const m = i;
        let sp = {
          name: nanoid(),
          gender: genOpt[Math.floor(Math.random() * 3)],
          relationship: 'SpouseTo',
          relReverse: 'SposueTo',
          target: m.name
        }
        let p = {
          name: nanoid(),
          gender: genOpt[Math.floor(Math.random() * 3)],
          relationship: 'ParentTo',
          relReverse: 'ChildTo',
          target: m.name
        }
        let c = {
          name: nanoid(),
          gender: genOpt[Math.floor(Math.random() * 3)],
          relationship: 'ChildTo',
          relReverse: 'ParentTo',
          target: m.name
        }
        let s = {
          name: nanoid(),
          gender: genOpt[Math.floor(Math.random() * 3)],
          relationship: 'SiblingTo',
          relReverse: 'SiblingTo',
          target: m.name
        }

        newRels.push(sp, p, c, s);

        match += `MATCH (${m.name}:Person) WHERE ID(${m.name})= ${m.id} `

      })
      console.log(newRels.length);
      newRels.slice(0,50).forEach((i, idx, array) => {
        merge += `MERGE (${i.name})-[:FAMILY {relation:'${i.relationship}'}]->(${i.target}) MERGE (${i.name})<-[:FAMILY {relation:'${i.relReverse}'}]-(${i.target}) `
        if (idx === array.length - 1){
          create += `(${i.name}:Person {name:'${i.name}', gender:'${i.gender}'}) `
        } else {
          create += `(${i.name}:Person {name:'${i.name}', gender:'${i.gender}'}), `
        }
      })
      let query = match + create + merge + 'RETURN *';
      console.log(query);
      api
        .submitQuery(query)
        .then(() => {
          console.log('Test Data Generated');
          $('.member').remove();
          $('#graph svg').remove();
          $('#current-members option').remove();
        })
        .finally(() => {
          renderGraph();
          makeList();
        });
    })
}

const genRels = () => {
  console.log('Making Relationships');
  let basicRels = [];
  api
    .getRelationships()
    .then(results => {
      let match = '';
      let merge = '';

      results[0].members.forEach(member => {
        const mID = member.identity.low;
        const mName = member.properties.name;

        match += `MATCH (${mName}:Person) WHERE ID(${mName})= ${mID} `;
      })

      results[0].dirRel.forEach((i, idx, array) => {
        const sName = i.start.properties.name;
        const rel = i.simpleRel;
        const eName = i.end.properties.name;

        merge += `MERGE (${sName})-[:FAMILY {relation:'${rel}'}]->(${eName}) `
      })
      let query = match + merge + 'RETURN *';

      console.log(query);
      api.submitQuery(query);
    })
    .then(() => {
      console.log('made relationships')
    })
}

const renderGraph = () => {
  // var width = window.innerWidth, height = 800;
  var width = $('#graph').width(), height = $('#graph').height();

  var svg = d3.select('#graph').append('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('pointer-events', 'all')
    .style('cursor', 'move')
    .style('font', '1.5rem sans-serif')
    .attr('text-anchor', 'middle');

  const container = svg.append('g');
  const linksGr = container.append('g');
  const nodesGr = container.append('g');
  const nodesTxGr = container.append('g');

  const x = d3.scaleLinear([0, 1], [0, 100]);
  const y = d3.scaleLinear([0, 1], [0, 100]);

  api
    .getGraph()
    .then(graph => {
      let label = {
        'nodes': [],
        'links': []
      };

      graph.nodes.forEach((d,i) => {
        label.nodes.push({node: d});
        label.nodes.push({node: d});
        label.links.push({
          source: i * 2,
          target: i * 2 + 1
        });
      });

      const simulation = d3.forceSimulation(graph.nodes)
          .force('link', d3.forceLink(graph.links).distance(250).id(d => d.id))
          .force('charge', d3.forceManyBody().strength(-1000))
          .force('center', d3.forceCenter(width / 2, height / 2));

      const link = linksGr
          .attr('stroke', '#999')
        .selectAll('line')
        .data(graph.links)
        .join('line')
          .attr('stroke-width', '3')
          .attr('stroke', '#999')
          .attr('class', d => d.relType);

      const node = nodesGr
          .attr('stroke-width', 1.5)
        .selectAll('g')
        .data(graph.nodes)
        .join('g')
          .attr('cx', d => x(d[1]))
          .attr('cy', d => y(d[2]))
          .attr('class', 'node')
          .call(drag(simulation));


      node.append('circle')
        .attr('id', (d,i) => {
          d.nodeUid = 'node-' + i;
          return d.nodeUid;
        })
        .attr('r', 40)
        .attr('stroke', '#fff')
        .attr('fill', '#3BCEAC')
        .attr('cx', d => x(d[1]))
        .attr('cy', d => y(d[2]))

      node.append('text')
        .text(d =>  d.name)
        .style('fill', '#555')

      node.append('title')
        .text(d => {
          return d.name;
        });

      link.append('title')
        .text(d => {
          return `${d.source.name} is ${d.relType} to ${d.target.name}`
        })

      simulation.on('tick', () => {
        link
          .attr('x1', d => d.source.x)
          .attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x)
          .attr('y2', d => d.target.y)

        node
          .selectAll('circle')
            .attr('cx', d => d.x)
            .attr('cy', d => d.y);

        node
          .selectAll('clipPath')
            .attr('dx', d => d.x)
            .attr('dy', d => d.y);

        node
          .selectAll('text')
            .attr('dx', d => d.x)
            .attr('dy', d => d.y + 60);
      });

      let transform;

      const zoom = d3.zoom()
        .scaleExtent([.1, 4])
        .on('zoom', e => {
          container.attr('transform', (transform = e.transform));
        });

      return svg
        .call(zoom)
        .call(zoom.transform, d3.zoomIdentity)
        .node();
    })

    const drag = simulation => {
      function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }

      return d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended);
    }
}

const makeList = () => {
  const memberList = $('#node-list');
  const memberSelect = $('#current-members');

  api
    .getFamily()
    .then(family => {
      family.forEach(member => {
        let memberId = member.id;
        let memberName = member.name;

        memberList.append(`<li class="member">${memberName}</li>`);
        memberSelect.append(`<option value="${memberId}">${memberName}</option>`);
      });
    })
}


const addMember = (m, r, n, g) => {
  let query = {};
  query.src = n;
  query.rel = r;
  query.rev = (query.rel == 'ChildTo') ? 'ParentTo'
            : (query.rel == 'ParentTo') ? 'ChildTo'
            : (query.rel == 'SiblingTo') ? 'SiblingTo'
            : (query.rel == 'SpouseTo') ? 'SpouseTo'
            : 'Unknown';
  query.tar = parseInt(m);
  query.gen = g;

  console.log(query);

  if (query.src !== "" && query.src !== undefined) {
    console.log(`Valid name submitted. Creating person ${query.src} who is ${query.gen}. ${query.src} is ${query.rel} ${query.tar} and ${query.tar} is ${query.rev} ${query.src}.`)
    api
      .addFamilyMember(query)
      .then(results => {
        let match = '';
        let merge = '';

        console.log(results)

        results[0].members.forEach(member => {
          const mID = member.identity.low;
          const mName = member.properties.name;

          match += `MATCH (${mName}:Person) WHERE ID(${mName})= ${mID} `;
        })

        results[0].dirRel.forEach((i, idx, array) => {
          const sName = i[Object.keys(i)[0]].properties.name;
          const rel = i.simpleRel;
          const eName = i[Object.keys(i)[2]].properties.name;
          console.log(`${sName} ${rel} ${eName}`);

          merge += `MERGE (${sName})-[:FAMILY {relation:'${rel}'}]->(${eName}) `
        })

        let query = match + merge + 'RETURN *';

        api.submitQuery(query);
      })
      .then(() => {
        $('.member').remove();
        $('#graph svg').remove();
        $('#current-members option').remove();
      })
      .then(() => {
        renderGraph();
        makeList();
      })
  }

}