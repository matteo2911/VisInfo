const width = window.innerWidth;
const height = window.innerHeight;

const svg = d3.select("#canvas")
  .attr("width", width)
  .attr("height", height);

let clickState = 0; // 0=prima posizione, 1=seconda, 2=terza

d3.json("data.json").then(data => {

  const xVals = data.flatMap(d => [d.v1, d.v3, d.v5]);
  const yVals = data.flatMap(d => [d.v2, d.v4, d.v6]);

  const xScale = d3.scaleLinear()
    .domain([d3.min(xVals), d3.max(xVals)])
    .range([50, width - 50]);

  const yScale = d3.scaleLinear()
    .domain([d3.min(yVals), d3.max(yVals)])
    .range([50, height - 50]);

  const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

  function getCoords(d, state) {
    if (state === 0) return [xScale(d.v1), yScale(d.v2)];
    if (state === 1) return [xScale(d.v3), yScale(d.v4)];
    if (state === 2) return [xScale(d.v5), yScale(d.v6)];
  }

  const symbols = svg.selectAll("path")
    .data(data)
    .enter()
    .append("path")
    .attr("d", d3.symbol().type(d3.symbolStar).size(800))
    .attr("fill", (d, i) => colorScale(i))
    .attr("stroke", "black")
    .attr("stroke-width", 1)
    .attr("transform", d => {
      const [x, y] = getCoords(d, 0);
      return `translate(${x},${y})`;
    });

  function animateToState(state) {
    symbols.transition()
      .duration(1000)
      .ease(d3.easeLinear)
      .attrTween("transform", function(d) {
        const [x0, y0] = this.__currentPos || getCoords(d, clickState);
        const [x1, y1] = getCoords(d, state);

        this.__currentPos = [x1, y1];

        return function(t) {
          const x = x0 + (x1 - x0) * t;
          const y = y0 + (y1 - y0) * t;
          return `translate(${x},${y})`;
        };
      });
  }

  symbols.each(function(d) {
    this.__currentPos = getCoords(d, 0);
  });

  svg.on("click", () => {
    clickState = (clickState + 1) % 3;
    animateToState(clickState);
  });

}).catch(err => {
  console.error("Errore caricando data.json:", err);
});
