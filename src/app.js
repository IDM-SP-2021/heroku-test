import './css/styles.css';
var $ = require('jquery');
const _ = require('lodash');
const d3 = require('d3');

var api = require('./scripts/neo4j')


$(function () {
  console.log('Page loaded.');
  renderGraph();
  // api.getGraph();
  // console.log(api.getGraph())
});

const renderGraph = () => {
  var width = 800, height = 800;

  var data = api.getGraph();
  console.log(data);

  // const links = data.links.map(d => Object.create(d));
  // const nodes = data.p.map(d => Object.create(d));

  // const simulation = d3.forceSimulation(nodes)
  //     .force("link", d3.forceLink(links).id(d => d.id))
  //     .force("charge", d3.forceCenter(width /2, height / 2));

  // const svg = d3.create('svg')
  //     .attr("viewbox", [0, 0, width, height]);

  // const link = svg.append('g')
  //     .attr('stroke', '#999')
  //     .attr('stroke-opacity', 0.6)
  //   .selectAll('line')
  //   .data(links)
  //   .join('line')
  //     .attr('stroke-width', d => Math.sqrt(d.value));

  // const node = svg.append('g')
  //     .attr('stroke', '#fff')
  //     .attr('stroke-width', 1.5)
  //   .selectAll('circle')
  //   .data(nodes)
  //   .join('circle')
  //     .attr('r', 5)
  //     .attr('fill', color)
  //     .call(drag(simulation));

  // node.append('title')
  //     .text(d => d.name);

  // simulation.on('tick', () => {
  //   link
  //       .attr('x1', d => d.source.x)
  //       .attr('y1', d => d.source.y)
  //       .attr('x2', d => d.target.x)
  //       .attr('y2', d => d.target.y);

  //   node
  //       .attr('cx', d => d.x)
  //       .attr('cy', d => d.y);
  // });

  // invalidation.then(() => simulation.stop());

  // return svg.node();
}

// const renderGraph = () => {
//     var width = 800, height = 800;
//   var force = d3.layout.force()
//     .charge(-200).linkDistance(20).size([width, height]);

//   var svg = d3.select("#graph").append("svg")
//     .attr("width", "100%").attr("height", "100%")
//     .attr("pointer-events", "all");

//   api
//     .getGraph()
//     .then(graph => {
//       force.nodes(graph.nodes).links(graph.links).start();

//       var link = svg.selectAll(".link")
//         .data(graph.links).enter()
//         .append("line").attr("class", "link");

//       var node = svg.selectAll(".node")
//         .data(graph.nodes).enter()
//         .append("circle")
//         .attr("class", d => {
//           return "node " + d.label
//         })
//         .attr("r", 30)
//         .call(force.drag);

//       // html title attribute
//       node.append("title")
//         .text(d => {
//           return d.name;
//         });

//       // force feed algo ticks
//       force.on("tick", () => {
//         link.attr("x1", d => {
//           return d.source.x;
//         }).attr("y1", d => {
//           return d.source.y;
//         }).attr("x2", d => {
//           return d.target.x;
//         }).attr("y2", d => {
//           return d.target.y;
//         });

//         node.attr("cx", d => {
//           return d.x;
//         }).attr("cy", d => {
//           return d.y;
//         });
//       });
//     });
// };