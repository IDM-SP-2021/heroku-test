import { makeArray } from 'jquery';
import './css/styles.css';
var $ = require('jquery');
const d3 = require('d3');

var api = require('./scripts/neo4j')

$(function () {
  renderGraph();
  makeList();

  $('#add-member').on('submit', (e) => {
    e.preventDefault();
    addMember();
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

  // const testData = $('#test-data button');
  // testData.on('click', () => {
  //   console.log('Generating Test Data');
  //   api
  //     .testData()
  //     // .then(rels => {
  //     //   api
  //     //     .makeRelationships(rels);
  //     // })
  //     // .then(() => {
  //     //   $('.member').remove();
  //     //   $('#graph svg').remove();
  //     //   $('#current-members option').remove();
  //     // })
  //     // .then(() => {
  //     //   renderGraph();
  //     //   makeList();
  //     // });
  // });

  const makeRels = $('#make-rels button');
  makeRels.on('click', () => {
    console.log('Making Relationships');
    api
      .getRelationships()
      .then(rels => {
        api
          .makeRelationships(rels);
      })
      .then(() => {
        $('.member').remove();
        $('#graph svg').remove();
        $('#current-members option').remove();
      })
      .then(() => {
        renderGraph();
        makeList();
      });
  });
});


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

  const g = svg.append('g');
  const linksGr = g.append('g')
    .attr('id', 'graph-links');
  const nodesGr = g.append('g')
    .attr('id', 'graph-nodes');

  const x = d3.scaleLinear([0, 1], [0, 100]);
  const y = d3.scaleLinear([0, 1], [0, 100]);

  api
    .getGraph()
    .then(graph => {
      const links = graph.links.map(d => Object.create(d));
      const nodes = graph.nodes.map(d => Object.create(d));

      const simulation = d3.forceSimulation(nodes)
          .force('link', d3.forceLink(links).distance(250).id(d => d.id))
          .force('charge', d3.forceManyBody().strength(-1000))
          .force('center', d3.forceCenter(width / 2, height / 2));

      const link = linksGr
          .attr('stroke', '#999')
        .selectAll('line')
        .data(links)
        .join('line')
          .attr('stroke-width', '3')
          .attr('stroke', '#999')
          .attr('class', d => d.relType);

      const node = nodesGr
          .attr('stroke', '#fff')
          .attr('stroke-width', 1.5)
        .selectAll('g')
        .data(nodes)
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
        .attr('fill', '#3BCEAC')
        .attr('cx', d => x(d[1]))
        .attr('cy', d => y(d[2]))
        // .attr('y', 0);


      node.append('clipPath')
          .attr('id', (d,i) => {
            d.clipUid = 'clip-' + i;
            return d.clipUid;
          })
        .append('use')
          .attr('xlink:href', (d,i) => {
            d.nodeUid = 'node-' + i;
            return d.nodeUid;
          });

      node.append('text')
          .attr('clip-path', d => d.clipUid)
          .attr('dx', d => x(d[1]))
          .attr('dy', d => y(d[2]))
          .attr('stroke', 'none')
          .attr('fill', '#fff')
        .selectAll('tspan')
        .data(d => d.name.split(/(?=[A-Z][a-z])|\s+/g))
        .join('tspan')
          .attr('x', 0)
          .attr('y', (d, i, nodes) => `${i - nodes.length / 2 + 0.8}em`)
          .text(d => d);

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
          .selectAll('text')
            .attr('dx', d => d.x)
            .attr('dy', d => d.y);
      });

      let transform;

      const zoom = d3.zoom().on('zoom', e => {
        g.attr('transform', (transform = e.transform));
        g.style('stroke-width', 3 / Math.sqrt(transform.k));
        node.selectAll('circle').attr('r', 50 / Math.sqrt(transform.k));
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
  var familyMembers = [];

  if ($('.member').length > 0) {
    $('.member').each(function() {
      var elId = this.id;
      var memberName = elId.substring(elId.indexOf("-") + 1);
      familyMembers.push(memberName);
    });
  }

  api
    .getFamily()
    .then(family => {
      family.forEach(member => {
        var memberName = member.name;
        var listId = `member-${memberName.toLowerCase()}`

        if (familyMembers.includes(memberName.toLowerCase()) === false) {
          memberList.append(`<li id="${listId}" class="member">${member.name}</li>`);

          memberSelect.append(`<option value=${memberName}>${memberName}</option>`);

          familyMembers.push(memberName)
        }
      });
    })
}

const addMember = () => {
  let query = [];
  const newName = $.trim($('#new-name').val());
  const relation = $('#relationship').val();
  const relationName = $('#current-members').val();

  console.log(relation);

  if (relation == 'Child') {
    let s = relationName;
    let r = 'Parent';
    let rev = 'Child'
    let t = newName;
    let n = newName;

    query.push({s, r, rev, t, n});
  } else if (relation == 'Parent') {
    let s = newName;
    let r = relation;
    let rev = 'Child'
    let t = relationName;
    let n = newName;

    query.push({s, r, rev, t, n});
  } else if (relation == 'Sibling') {
    let s = newName;
    let r = relation;
    let rev = relation;
    let t = relationName;
    let n = newName;

    query.push({s, r, rev, t, n});
  }

  console.log(query);

  if (newName !== "" && newName !== undefined) {
    console.log('newName is valid: ' + newName);

    api
      .checkFamily(newName)
      .then(members => {
        if (members.length > 0) {
          console.log('Person with that name already exists');
        } else {
          console.log('Person does not exist yet');
          api
            .addFamilyMember(query)
            .then(() => {
              $('.member').remove();
              $('#graph svg').remove();
              $('#current-members option').remove();
            })
            .then(result => {
              renderGraph();
              makeList();
            });
        }
      })
  } else {
    console.log('Query is invalid');
  }
}