export let nbColumns = 0;
export let data = [];
export let colors5 = ['#c7001e', '#ca6675', '#cccccc', '#6a9ebd', '#086fad'];
export let colors7 = ['#c7001e', '#c94458', '#ca8892', '#cccccc', '#8badc2', '#498eb7', '#086fad'];
export let loadedFile = '';
export let document;
export let timeSinceLastChange = 0;
export let changeHappened = false;

//<![CDATA[

export function printReady() {

    if (checkbox_print.checked) {
        colors5 = ['#002c4c', '#0068b2', '#0094ff', '#72c4ff', '#d8efff'];
        colors7 = ['#002c4c', '#114267', '#2a5b83', '#4d799e', '#789bb9', '#adc1d5', '#eaedf0'];
    }
    else {
        colors5 = ['#c7001e', '#ca6675', '#cccccc', '#6a9ebd', '#086fad'];
        colors7 = ['#c7001e', '#c94458', '#ca8892', '#cccccc', '#8badc2', '#498eb7', '#086fad'];
    }
    for (let i = 0; i < nbColumns; i++) {
        if (nbColumns === 5) {
            document.getElementById(`color${i + 1}`).value = colors5[i];
        } else if (nbColumns === 7) {
            document.getElementById(`color${i + 1}`).value = colors7[i];
        }
    }

}

function purgeData() {
    document.getElementById('labelDiv').innerHTML = '';
    document.getElementById('colorDiv').innerHTML = '';
    document.getElementById('headColors').innerHTML = '';
}

export function readFile(evt) {
    console.log("purge data");
    purgeData();
    let files = evt.target.files;
    let fileToRead = files[0];
    let reader = new FileReader();
    reader.addEventListener('loadend', () => {
        localStorage.setItem("tempcsv", reader.result);
        let file = localStorage.getItem("tempcsv");
        data = d3.csv.parse(file);
        nbColumns = (Object.keys(data[0]).length - 2);

        for (let i = 0; i < nbColumns; i++) {
            let colorNode = document.createElement("input");
            colorNode.id = `color${i + 1}`;
            colorNode.type = 'color';
            colorNode.class = 'basic';
            colorNode.addEventListener("change", plot);

            let labelNode = document.createElement("label");
            let labelNodeTmp = document.createTextNode(`Label for ${i+1}`);
            labelNode.id = `labelContainer${i+1}`;
            let inputLabelNode = document.createElement("input");
            inputLabelNode.class = "form-control";
            inputLabelNode.id = `label${i+1}`;
            inputLabelNode.value = `label ${i+1}`;
            inputLabelNode.addEventListener("change", autoplot);
            labelNode.appendChild(labelNodeTmp);
            labelNode.appendChild(inputLabelNode);
            document.getElementById('labelDiv').appendChild(labelNode);

            if (nbColumns === 5) {
                colorNode.value = colors5[`${i}`];
            } else if (nbColumns === 7) {
                colorNode.value = colors7[`${i}`];
            }
            document.getElementById('colorDiv').appendChild(colorNode);

        }

        let buttonColor = document.createElement("button");
        let buttonText = document.createTextNode("Reset colors");
        buttonColor.appendChild(buttonText);
        buttonColor.addEventListener("click", () => {
            printReady();
            plot();
        });
        document.getElementById('headColors').appendChild(buttonColor);

        let color = preparePlot();

        plot();
    });
    //reader.onload = function () {
    //    localStorage.setItem("tempcsv", this.result);
    //}
    reader.readAsText(fileToRead);
    document.getElementById("selectedFilename").innerHTML = "Selected file : " + fileToRead.name;
}

export function autoplot() {
    timeSinceLastChange = 0;
    changeHappened = true;
    setInterval( () => {
        if (timeSinceLastChange > 1 && changeHappened) {
            return plot();
        }
        timeSinceLastChange ++;
    }, 1000);
}

export function preparePlot() {

    //Clear previous plot
    d3.select("svg").remove();

    //Prepare color domain
    var colors = [];
    for (let i = 0; i < nbColumns; i++) {
        colors.push(document.getElementById(`color${i + 1}`).value);
    }
    var color = d3.scale.ordinal().range(colors);
    return color
}

export function plot() {

    timeSinceLastChange = 0;
    changeHappened = false;

    var file = localStorage.getItem("tempcsv");
    var color = preparePlot();
    data = d3.csv.parse(file);
    var margin = {top: 50, right: 20, bottom: 50, left: 300},
        width = 800 - margin.left - margin.right,
        height = -margin.top - margin.bottom + 50 * data.length

    var y = d3.scale.ordinal()
        .rangeRoundBands([0, height], .3);

    var x = d3.scale.linear()
        .rangeRound([0, width]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("top");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")

    var svg = d3.select("#figure").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .attr("id", "d3-plot")
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("text")
        .attr("x", ((width - margin.left) / 2))
        .attr("y", height + 20)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("text-anchor", "middle")
        .text(document.getElementById("title").value);

    var colors = [];
    for (let i = 0; i < nbColumns; i++) {
        colors.push(document.getElementById(`label${i + 1}`).value);
    }

    color.domain(colors);

    data.forEach(function (d) {
        // calc percentages
        for (let i = 0; i < nbColumns; i++) {
            d[document.getElementById(`label${i+1}`).value] = +d[i+1] * 100 / d.N;
        }

        var x0 = -1 * (d[document.getElementById("label4").value] / 2 + d[document.getElementById("label3").value] +  d[document.getElementById("label2").value] + d[document.getElementById("label1").value]);
        var idx = 0;
        d.boxes = color.domain().map(function (name) {
            return {name: name, x0: x0, x1: x0 += +d[name], N: +d.N, n: +d[idx += 1]};
        });
    });

    var min_val = d3.min(data, function (d) {
        return d.boxes["0"].x0;
    });

    var max_val = d3.max(data, function (d) {
        return d.boxes[nbColumns - 1].x1;
    });

    x.domain([min_val, max_val]).nice();
    y.domain(data.map(function (d) {
        return (d.Question);
    }));

    svg.append("g")
        .attr("class", "x axis")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)

    var vakken = svg.selectAll(".question")
        .data(data)
        .enter().append("g")
        .attr("class", "bar")
        .attr("transform", function (d) {
            return "translate(0," + y(d.Question) + ")";
        });

    var bars = vakken.selectAll("rect")
        .data(function (d) {
            return d.boxes;
        })
        .enter().append("g").attr("class", "subbar");

    bars.append("rect")
        .attr("height", 20) //y.rangeBand()
        .attr("x", function (d) {
            return x(d.x0);
        })
        .attr("width", function (d) {
            return x(d.x1) - x(d.x0);
        })
        .style("fill", function (d) {
            return color(d.name);
        });

    bars.append("text")
        .attr("x", function (d) {
            return x(d.x0);
        })
        .attr("y", 10)//y.rangeBand()/2
        .attr("dy", "0.4em")
        .style("font", "20px sans-serif")
        .style("text-anchor", "begin")
        .style("color", function (d) {
            if (d.n < 2) {
                return "000";
            } else {
                return "black";
            }
        })
        .text(function (d) {
            return d.n !== 0 && (d.x1 - d.x0) > (3) ? d.n : ""
        });

    vakken.insert("rect", ":first-child")
        .attr("height", 20)//y.rangeBand()
        .attr("x", "1")
        .attr("width", width)
        .attr("fill-opacity", "0.5")
        .style("fill", "#F5F5F5")
        .attr("class", function (d, index) {
            return index % 2 == 0 ? "even" : "uneven";
        });

    svg.append("g")
        .attr("class", "y axis")
        .append("line")
        .attr("x1", x(0))
        .attr("x2", x(0))
        .attr("y2", height);

    var startp = svg.append("g").attr("class", "legendbox").attr("id", "mylegendbox");
    let nbChar = 0;
    let spaceByElm = []
    console.log(nbColumns);
    for (let cpt = 1; cpt < (nbColumns + 1); cpt++) {
        nbChar = nbChar + document.getElementById(`label${cpt}`).value.length;
        spaceByElm[cpt-1] = 40 + document.getElementById(`label${cpt}`).value.length * 7
    }
    let neededSpace = nbColumns * 40 + 7 * nbChar;
    console.log(nbChar, neededSpace, spaceByElm);
    let spaceBeetween = (500 - neededSpace) / (nbColumns - 1);
    // this is not nice, we should calculate the bounding box and use that

    let legend_tabs = [0];
    let tmp = 0;
    for (let cpt = 1; cpt < (nbColumns); cpt++) {
        tmp += spaceByElm[cpt-1] + spaceBeetween;
        legend_tabs.push(tmp);
    }

    var legend = startp.selectAll(".legend")
        .data(color.domain().slice())
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function (d, i) {
            console.log(i, legend_tabs);
            return "translate(" + legend_tabs[i] + ",-45)";
        });

    legend.append("rect")
        .attr("x", 0)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color);

    legend.append("text")
        .attr("x", 22)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "begin")
        .style("font", "10px sans-serif")
        .text(function (d) {
            return d;
        });

    d3.selectAll(".axis path")
        .style("fill", "none")
        .style("stroke", "#000")
        .style("shape-rendering", "crispEdges")

    d3.selectAll(".axis line")
        .style("fill", "none")
        .style("stroke", "#000")
        .style("shape-rendering", "crispEdges")

    var movesize = width / 2 - startp.node().getBBox().width / 2;
    d3.selectAll(".legendbox").attr("transform", "translate(" + movesize + ",0)");

}

export function prepareDownload() {
    plot()
    //get svg element.
    var svgelt = document.getElementById("d3-plot");
    //get svg source.
    var serializer = new XMLSerializer();
    var source = serializer.serializeToString(svgelt);

    //add name spaces.
    if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    if (!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
        source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    }

    //add xml declaration
    source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

    //set url value to a element's href attribute.
    //document.getElementById("downloadButton").href = url;
    //you can download svg file by right click menu.
    var file = new File([source], "DivergingLikert.svg", {type: "image/svg+xml"});
    saveAs(file);
}

export function setDocument(doc) {
    document = doc;
    document.getElementById('file').addEventListener('change', readFile, false);
    return doc;
}