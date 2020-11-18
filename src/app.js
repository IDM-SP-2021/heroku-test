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

  const testData = $('#test-data button');
  testData.on('click', () => {
    console.log('Generating Test Data');
    // getFamily()
    // .then(family => {
    // family.forEach(member => {
    //   console.log(member)
    //   setTimeout(function() {
    //     let m = member.name;
    //     let sp = Math.floor(Math.random() * 1000000) + 1;
    //     let p = Math.floor(Math.random() * 1000000) + 1;
    //     let c = Math.floor(Math.random() * 1000000) + 1;
    //     let s = Math.floor(Math.random() * 1000000) + 1;
    //     let g = Math.floor(Math.random() * 2) + 1;
    //     let gen = (g == 1) ? 'M'
    //             : (g == 2) ? 'F'
    //             : 'Undefined'
    //   }, 200)
    // }

    api
      .getFamily()
      .then(family => {
        family.forEach(member => {
          console.log(member);
          let newMems = [];
          const genOpt = ['M', 'F', 'X']
          const m = member;
          let sp = {
            name: '' + Math.floor(Math.random() * 1000000) + 1,
            gender: genOpt[Math.floor(Math.random() * 3)],
            relationship: 'SpouseTo'
          }
          let p = {
            name: '' + Math.floor(Math.random() * 1000000) + 1,
            gender: genOpt[Math.floor(Math.random() * 3)],
            relationship: 'ParentTo'
          }
          let c = {
            name: '' + Math.floor(Math.random() * 1000000) + 1,
            gender: genOpt[Math.floor(Math.random() * 3)],
            relationship: 'ChildTo'
          }
          let s = {
            name: '' + Math.floor(Math.random() * 1000000) + 1,
            gender: genOpt[Math.floor(Math.random() * 3)],
            relationship: 'SiblingTo'
          }

          // console.log(`Member: ${member.name} | Spouse: ${sp.name} | Parent: ${p.name} | Child: ${c.name} | Sibling: ${s.name}`);

          newMems.push(sp, p, c, s);
          console.log(newMems)
          newMems.forEach(mem => {
            console.log(`m: ${member.name} | r: ${mem.relationship} | n: ${mem.name} | g: ${mem.gender}`)
            addMember(member.name, mem.relationship, mem.name, mem.gender);
          })
        })
      })
  });

  const makeRels = $('#make-rels button');
  makeRels.on('click', () => {
    console.log('Making Relationships');
    let basicRels = [];
    api
      .getRelationships()
      .then(rels => {
        rels.forEach(rel => {
          // console.log(rel.newRel)
          if (rel.newRel.match(/^(SpouseTo|SiblingTo|ChildTo|ParentTo)$/)) {
            basicRels.push(rel);
          }
        })
        console.log(basicRels);
        api
          .makeRelationships(basicRels);
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
      setTimeout(function() { console.log(basicRels) }, 10000)
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
        .data(d => d.name)
        // .data(d => d.name.split(/(?=[A-Z][a-z])|\s+/g))
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
        console.log('Making List')
        console.log(member)
        var memberName = member.name;
        console.log(memberName)
        var listId = `member-${memberName}`

        if (familyMembers.includes(memberName) == false) {
          memberList.append(`<li id="${listId}" class="member">${member.name}</li>`);

          memberSelect.append(`<option value=${memberName}>${memberName}</option>`);

          familyMembers.push(memberName)
        } else {
          console.log('Name in list')
        }
      });
    })
}


const addMember = (m, r, n, g) => {
  let query = [];
  const src = n;
  const rel = r;
  let rev = (rel == 'ChildTo') ? 'ParentTo'
            : (rel == 'ParentTo') ? 'ChildTo'
            : (rel == 'SiblingTo') ? 'SiblingTo'
            : (rel == 'SpouseTo') ? 'SpouseTo'
            : 'Unknown';
  const tar = m;
  const gen = g;

  query.push(src, rel, rev, tar, gen);

  console.log(query);

  if (src !== "" && src !== undefined) {
    console.log(`Valid name submitted. Creating person ${src} who is ${gen}. ${src} is ${r} ${tar} and ${tar} is ${rev} ${src}.`)
  }
  // if (newName !== "" && newName !== undefined) {
  //   console.log('newName is valid: ' + newName);

  //   api
  //     .checkFamily(newName)
  //     .then(members => {
  //       if (members.length > 0) {
  //         console.log('Person with that name already exists');
  //       } else {
  //         console.log('Person does not exist yet');
  //         api
  //           .addFamilyMember(query)
  //           .then(() => {
  //             $('.member').remove();
  //             $('#graph svg').remove();
  //             $('#current-members option').remove();
  //           })
  //           .then(result => {
  //             renderGraph();
  //             makeList();
  //           });
  //       }
  //     })
  // } else {
  //   console.log('Query is invalid');
  // }
}