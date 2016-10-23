import React from "react";
import Radium from "radium";
// import _ from "lodash";
// import Flex from "./framework/flex";
import { connect } from "react-redux";
// import { FOO } from "../actions";
import {VictoryAxis} from "victory";
import * as globals from "../../util/globals";
import Card from "../framework/card";

@connect(state => {
  return state.frequencies;
})
@Radium
class Frequencies extends React.Component {
  constructor(props) {
    super(props);
    this.state = {

    };
  }
  static propTypes = {
    /* react */
    // dispatch: React.PropTypes.func,
    params: React.PropTypes.object,
    routes: React.PropTypes.array,
    /* component api */
    style: React.PropTypes.object,
    genotype: React.PropTypes.string,
  }
  static defaultProps = {
    genotype:["global", "HA1", "159F"]
  }
  getStyles() {
    return {
      base: {

      }
    };
  }

  drawFrequencies() {
    const frequencyChartWidth = 900;
    const frequencyChartHeight = 300;
    const bottomPadding = 45;
    const leftPadding = 80;
    const rightPadding = 80;
    const pivots = this.props.pivots;
    const x = d3.scale.linear()
                    .domain([pivots[0], pivots[pivots.length-1]]) // original array, since the x values are still mapped to that
                    .range([leftPadding,leftPadding + frequencyChartWidth - rightPadding]);

    const y = d3.scale.linear()
                    .domain([0, 1.05]) // original array, since the x values are still mapped to that
                    .range([frequencyChartHeight-bottomPadding, 0]);

    const traj = [];
    const states = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K",
                         "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V",
                         "W", "X", "Y", "Z", "-", "*"];
    let tCount=0;
    for (let si=0; si<states.length; si+=1){
      const key = this.props.genotype
                  ? this.props.genotype+states[si]
                  : "not found";
      if (key !== "not found" && this.props.frequencies[key]){
        const vals = this.props.frequencies[key];
        const new_traj = { d: ("M"+x(pivots[0]).toString()+" " + y(vals[0]).toString() + vals.map((v,i) => ["L", x(pivots[i]).toString(), y(v).toString()].join(" ")).join(" ")),
                          strokeWidth: 3,
                          stroke:globals.genotypeColors[tCount%10]
                        }
        traj.push(new_traj);
        tCount++;
      }
    }

    return (
      <Card title={"Frequencies"}>
        <svg width={frequencyChartWidth} height={frequencyChartHeight}>
          {
            traj.map((p) => {
            return (
              <path {...p}  fill={"none"} />
            );
          })}
          <VictoryAxis
            padding={{
              top: 0,
              bottom: 0,
              left: leftPadding, // cosmetic, 1px overhang, add +1 if persists
              right: 0 // this is confusing, but ok
            }}
            domain={x.domain()}
            offsetY={bottomPadding}
            width={frequencyChartWidth}
            standalone={false}
            label={"Position"}
          />
          <VictoryAxis
            dependentAxis
            padding={{
              top: 0,
              bottom: bottomPadding,
              left: leftPadding, // cosmetic, 1px overhang, add +1 if persists
              right: rightPadding / 2 // bug? why is that / 2 necessary...
            }}
            domain={y.domain()}
            offsetY={bottomPadding}
            width={frequencyChartWidth}
            standalone={false}
          />
        </svg>
      </Card>
    );
  }

  render() {
    const styles = this.getStyles();
    return (
      <div style={[
        styles.base,
        this.props.style
      ]}>
        {this.props.frequencies ? this.drawFrequencies() : "Waiting on freq data"}
      </div>
    );
  }
}

export default Frequencies;