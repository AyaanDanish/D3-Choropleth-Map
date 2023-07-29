import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as topojson from "https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/+esm";

const educationDataUrl =
  "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json";

const countiesUrl =
  "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json";

const fetchData = async (url) => {
  const response = await fetch(url);
  return await response.json();
};

Promise.all([fetchData(countiesUrl), fetchData(educationDataUrl)]).then(
  ([topojsonData, dataset]) => {
    const geojsonData = topojson.feature(
      topojsonData,
      topojsonData.objects.counties
    );

    const tooltip = d3
      .select("#container")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    const svg = d3
      .select("#container")
      .append("svg")
      .attr("width", "1000px")
      .attr("height", "700px");

    // Create a D3 geoPath generator
    const path = d3.geoPath();

    const colorExtent = ["#cadeef", "#0600c4"];

    // Create a color scale for the education data
    const colorScale = d3
      .scaleSequential()
      .domain(d3.extent(dataset, (d) => d.bachelorsOrHigher))
      .interpolator(d3.interpolateRgb(...colorExtent));

    // Draw the map
    svg
      .append("g")
      .attr("id", "map")
      .selectAll("path")
      .data(geojsonData.features)
      .enter()
      .append("path")
      .attr("class", "county")
      .attr("d", path)
      .attr("fill", (d) =>
        colorScale(dataset.find((item) => item.fips === d.id).bachelorsOrHigher)
      )
      .on("mouseover", function (e, d) {
        d3.select(this).attr("class", "county highlighted");
        const county = dataset.find((item) => item.fips === d.id);

        tooltip
          .style("opacity", 0.75)
          .html(
            `${county.area_name}, ${county.state}: ${county.bachelorsOrHigher}%`
          )
          .style("left", e.pageX + 15 + "px")
          .style("top", e.pageY - 50 + "px");
      })
      .on("mouseout", function () {
        d3.select(this).attr("class", "county");
        tooltip.style("opacity", 0);
      });

    const legendWidth = 300;
    const legendHeight = 15;

    const legendScale = d3
      .scaleLinear()
      .domain(d3.extent(dataset, (d) => d.bachelorsOrHigher))
      .range([0, legendWidth]);

    const legendAxis = d3.axisTop(legendScale).ticks(7);

    const legendGroup = svg
      .append("g")
      .attr("class", "legend")
      .attr("transform", `translate(650, 650)`);

    const numRects = 7; // Number of rectangles in the legend
    const rectWidth = legendWidth / numRects; // Width of each rectangle

    // Loop to create the rectangles and set their fill color based on the scale
    for (let i = 0; i < numRects; i++) {
      const xPos = i * rectWidth;
      const colorValue = legendScale.invert(xPos);
      const color = colorScale(colorValue);

      legendGroup
        .append("rect")
        .attr("x", xPos)
        .attr("y", 0)
        .attr("width", rectWidth)
        .attr("height", legendHeight)
        .attr("fill", color);
    }

    // Append the axis to the legend group
    legendGroup.call(legendAxis);
  }
);
