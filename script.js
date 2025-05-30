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
    if(state === 0) return [xScale(d.v1), yScale(d.v2)];
    if(state === 1) return [xScale(d.v3), yScale(d.v4)];
    if(state === 2) return [xScale(d.v5), yScale(d.v6)];
  }

  const symbols = svg.selectAll("path")
    .data(data)
    .enter()
    .append("path")
    .attr("d", d3.symbol().type(d3.symbolStar).size(800))
    .attr("fill", (d,i) => colorScale(i))
    .attr("stroke", "black")
    .attr("stroke-width", 1)
    .attr("transform", d => {
      const [x, y] = getCoords(d, 0);
      return `translate(${x},${y})`;
    });

  const trailsData = data.map(() => []);

  function updateTrails() {
    trailsData.forEach((trail, i) => {
      if (trail.length > 10) trail.shift();

      const trailSelection = svg.selectAll(`circle.trail-${i}`)
        .data(trail, (d, idx) => idx);

      trailSelection.enter()
        .append("circle")
        .attr("class", `trail trail-${i}`)
        .attr("r", 5)
        .attr("fill", "gold")
        .attr("opacity", 0)
        .attr("cx", d => d[0])
        .attr("cy", d => d[1])
        .merge(trailSelection)
        .attr("cx", d => d[0])
        .attr("cy", d => d[1])
        .attr("opacity", (d, idx) => (idx + 1) / trail.length * 0.8);

      trailSelection.exit().remove();
    });
  }

  function fadeOutTrail(i) {
    // seleziona i cerchi di questa scia
    const circles = svg.selectAll(`circle.trail-${i}`);

    circles.transition()
      .duration(800)      // durata dissolvenza
      .attr("opacity", 0)
      .remove();

    // svuota l’array della scia
    trailsData[i] = [];
  }

  function animateToState(state) {
  let finished = 0;
  const total = symbols.size();

  symbols.transition()
    .duration(1000)
    .ease(d3.easeLinear)
    .attrTween("transform", function(d, i) {
      const [x0, y0] = this.__currentPos || getCoords(d, clickState);
      const [x1, y1] = getCoords(d, state);

      this.__currentPos = [x1, y1];
      trailsData[i] = [];

      return function(t) {
        const x = x0 + (x1 - x0) * t;
        const y = y0 + (y1 - y0) * t;

        trailsData[i].push([x, y]);
        if (trailsData[i].length > 10) trailsData[i].shift();

        updateTrails();

        return `translate(${x},${y})`;
      };
    })
    .on("end", function(d, i) {
      finished++;
      if (finished === total) {
        
        for(let j = 0; j < total; j++) trailsData[j] = [];
        svg.selectAll("circle.trail")
          .transition()
          .duration(800)
          .attr("opacity", 0)
          .remove();
      }
    });
}

  symbols.each(function(d, i) {
    this.__currentPos = getCoords(d, 0);
  });

  svg.on("click", () => {
    clickState = (clickState + 1) % 3;
    animateToState(clickState);
  });

}).catch(err => {
  console.error("Errore caricando data.json:", err);
});
