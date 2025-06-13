let svg = d3.select("#canvas");
let statoClick = 0;
let simboli, scalaX, scalaY, datiScie, dati;

d3.json("data.json").then(jsonData => {
  dati = jsonData;

  const valoriX = dati.flatMap(d => [d.v1, d.v3, d.v5]);
  const valoriY = dati.flatMap(d => [d.v2, d.v4, d.v6]);

  const scalaColori = d3.scaleOrdinal(d3.schemeCategory10);

  datiScie = dati.map(() => []);

  function calcolaCoordinate(d, stato) {
    if (stato === 0) return [scalaX(d.v1), scalaY(d.v2)];
    if (stato === 1) return [scalaX(d.v3), scalaY(d.v4)];
    if (stato === 2) return [scalaX(d.v5), scalaY(d.v6)];
  }

  function aggiornaScale() {
    const larghezza = window.innerWidth;
    const altezza = window.innerHeight;

    svg.attr("width", larghezza).attr("height", altezza);

    scalaX = d3.scaleLinear()
      .domain([d3.min(valoriX), d3.max(valoriX)])
      .range([50, larghezza - 50]);

    scalaY = d3.scaleLinear()
      .domain([d3.min(valoriY), d3.max(valoriY)])
      .range([50, altezza - 50]);
  }

  function disegna() {
    aggiornaScale();

    svg.selectAll("*").remove();

    simboli = svg.selectAll("path")
      .data(dati)
      .enter()
      .append("path")
      .attr("d", d3.symbol().type(d3.symbolStar).size(800))
      .attr("fill", (d, i) => scalaColori(i))
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      .attr("transform", d => {
        const [x, y] = calcolaCoordinate(d, statoClick);
        return `translate(${x},${y})`;
      });

    simboli.each(function(d) {
      this.__posCorrente = calcolaCoordinate(d, statoClick);
    });
  }

  function aggiornaScie() {
    datiScie.forEach((scia, i) => {
      if (scia.length > 10) scia.shift();

      const selezioneScie = svg.selectAll(`circle.scia-${i}`)
        .data(scia, (d, idx) => idx);

      selezioneScie.enter()
        .append("circle")
        .attr("class", `scia scia-${i}`)
        .attr("r", 5)
        .attr("fill", "gold")
        .attr("opacity", 0)
        .attr("cx", d => d[0])
        .attr("cy", d => d[1])
        .merge(selezioneScie)
        .attr("cx", d => d[0])
        .attr("cy", d => d[1])
        .attr("opacity", (d, idx) => (idx + 1) / scia.length * 0.8);

      selezioneScie.exit().remove();
    });
  }

  // gestione del movimento
  function animaVersoStato(stato) {
  let completate = 0;
  const totale = simboli.size();

  simboli.transition()

    //durata del movimento
    .duration(1500)
    .ease(d3.easeLinear)
    .attrTween("transform", function(d, i) {
      // Prendi posizione corrente reale dalla trasformazione SVG
      let x0, y0;
      const ctm = this.getCTM();
      if (ctm) {
        x0 = ctm.e;
        y0 = ctm.f;
      } else {
        [x0, y0] = calcolaCoordinate(d, statoClick);
      }

      const [x1, y1] = calcolaCoordinate(d, stato);

      this.__posCorrente = [x1, y1];
      datiScie[i] = [];

      return function(t) {
        const x = x0 + (x1 - x0) * t;
        const y = y0 + (y1 - y0) * t;

        datiScie[i].push([x, y]);
        if (datiScie[i].length > 10) datiScie[i].shift();

        aggiornaScie();

        return `translate(${x},${y})`;
      };
    })
    .on("end", function(d, i) {
      completate++;
      if (completate === totale) {
        for (let j = 0; j < totale; j++) datiScie[j] = [];

        svg.selectAll("circle.scia")
          .transition()

          //durata della scia
          .duration(1200)
          .ease(d3.easeCubicOut)
          .attr("opacity", 0)
          .on("end", function() {
            d3.select(this).remove();
          });
      }
    });
}


  svg.on("click", () => {
    statoClick = (statoClick + 1) % 3;
    animaVersoStato(statoClick);
  });

  window.addEventListener("resize", () => {
    disegna();
  });

  disegna();
}).catch(err => {
  console.error("Errore caricando data.json:", err);
});
