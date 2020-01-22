/* eslint-disable react/no-danger */
import React from "react";
import { connect } from "react-redux";
import queryString from "query-string";
import Mousetrap from "mousetrap";
import { NarrativeStyles, linkStyles, OpacityFade } from './styles';
import ReactPageScroller from "./ReactPageScroller";
import { changePage, EXPERIMENTAL_showMainDisplayMarkdown } from "../../actions/navigation";
import { CHANGE_URL_QUERY_BUT_NOT_REDUX_STATE, TOGGLE_NARRATIVE } from "../../actions/types";
import { narrativeNavBarHeight } from "../../util/globals";

/* regarding refs: https://reactjs.org/docs/refs-and-the-dom.html#exposing-dom-refs-to-parent-components */
const progressHeight = 25;


@connect((state) => ({
  loaded: state.narrative.loaded,
  blocks: state.narrative.blocks,
  currentInFocusBlockIdx: state.narrative.blockIdx
}))
class Narrative extends React.Component {
  constructor(props) {
    super(props);
    this.state = {showingEndOfNarrativePage: false};
    this.exitNarrativeMode = () => {
      this.props.dispatch({type: TOGGLE_NARRATIVE, display: false});
    };
    this.changeAppStateViaBlock = (reactPageScrollerIdx) => {
      const idx = reactPageScrollerIdx-1;
      if (idx === this.props.blocks.length) {
        this.setState({showingEndOfNarrativePage: true});
      } else {
        if (this.state.showingEndOfNarrativePage) {
          this.setState({showingEndOfNarrativePage: false});
        }

        if (this.props.blocks[idx].mainDisplayMarkdown) {
          this.props.dispatch(EXPERIMENTAL_showMainDisplayMarkdown({
            query: queryString.parse(this.props.blocks[idx].query),
            queryToDisplay: {n: idx}
          }));
          return;
        }

        this.props.dispatch(changePage({
          // path: this.props.blocks[blockIdx].dataset, // not yet implemented properly
          dontChangeDataset: true,
          query: queryString.parse(this.props.blocks[idx].query),
          queryToDisplay: {n: idx},
          push: true
        }));
      }
    };
    this.goToNextSlide = () => {
      if (this.state.showingEndOfNarrativePage) return; // no-op
      this.reactPageScroller.goToPage(this.props.currentInFocusBlockIdx+1);
    };
    this.goToPreviousSlide = () => {
      if (this.props.currentInFocusBlockIdx === 0) return; // no-op
      this.reactPageScroller.goToPage(this.props.currentInFocusBlockIdx-1);
    };
  }
  componentDidMount() {
    if (window.twttr && window.twttr.ready) {
      window.twttr.widgets.load();
    }
    /* if the query has defined a block to be shown (that's not the first)
    then we must scroll to that block */
    if (this.props.currentInFocusBlockIdx !== 0) {
      this.reactPageScroller.goToPage(this.props.currentInFocusBlockIdx);
    }
    /* bind arrow keys to move around in narrative */
    /* Note that "normal" page scrolling is not avaialble in narrative mode
    and that scrolling the sidebar is associated with changing the narrative slide */
    Mousetrap.bind(['left', 'up'], this.goToPreviousSlide);
    Mousetrap.bind(['right', 'down'], this.goToNextSlide);
  }
  renderChevron(pointUp) {
    const dims = {w: 30, h: 30};
    const style = {
      zIndex: 200,
      position: "absolute",
      cursor: "pointer",
      left: `${this.props.width/2 - dims.w/2}px`
    };
    if (pointUp) style.top = narrativeNavBarHeight + progressHeight;
    else style.bottom = 0;
    const svgPathD = pointUp ?
      "M240.971 130.524l194.343 194.343c9.373 9.373 9.373 24.569 0 33.941l-22.667 22.667c-9.357 9.357-24.522 9.375-33.901.04L224 227.495 69.255 381.516c-9.379 9.335-24.544 9.317-33.901-.04l-22.667-22.667c-9.373-9.373-9.373-24.569 0-33.941L207.03 130.525c9.372-9.373 24.568-9.373 33.941-.001z" :
      "M207.029 381.476L12.686 187.132c-9.373-9.373-9.373-24.569 0-33.941l22.667-22.667c9.357-9.357 24.522-9.375 33.901-.04L224 284.505l154.745-154.021c9.379-9.335 24.544-9.317 33.901.04l22.667 22.667c9.373 9.373 9.373 24.569 0 33.941L240.971 381.476c-9.373 9.372-24.569 9.372-33.942 0z";
    return (
      <div id={`hand${pointUp?"Up":"Down"}`} style={style} onClick={pointUp ? this.goToPreviousSlide : this.goToNextSlide}>
        <svg width={`${dims.w}px`} height={`${dims.h}px`} viewBox="0 0 448 512">
          <path d={svgPathD} fill="black"/>
        </svg>
      </div>
    );
  }
  renderProgress() {
    return (
      <div
        style={{
          height: `${progressHeight}px`,
          width: "100%",
          backgroundColor: "inherit",
          boxShadow: '0px -3px 3px -3px rgba(0, 0, 0, 0.2) inset',
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-evenly",
          alignItems: "center"
        }}
      >
        {this.props.blocks.map((b, i) => {
          const d = (!this.state.showingEndOfNarrativePage) && this.props.currentInFocusBlockIdx === i ?
            "14px" : "6px";
          return (<div
            key={b.__html.slice(0, 30)}
            style={{width: d, height: d, background: "#74a9cf", borderRadius: "50%", cursor: "pointer"}}
            onClick={() => this.reactPageScroller.goToPage(i)}
          />);
        })}
      </div>
    );
  }
  renderBlocks() {
    const ret = this.props.blocks.map((b, i) => (
      <div
        id={`NarrativeBlock_${i}`}
        key={b.__html.slice(0, 50)}
        style={{
          padding: "10px 20px",
          height: "inherit",
          overflow: "hidden"
        }}
        dangerouslySetInnerHTML={b}
      />
    ));
    ret.push((
      <div key="EON" id="EndOfNarrative" style={{flexBasis: "50%", flexShrink: 0}}>
        <h3 style={{textAlign: "center"}}>
          END OF NARRATIVE
        </h3>
        <div style={{...linkStyles, textAlign: "center"}} onClick={() => this.reactPageScroller.goToPage(0)}>
          Scroll back to the beginning
        </div>
        <div style={{...linkStyles, textAlign: "center", marginTop: "10px"}} onClick={this.exitNarrativeMode}>
          Leave the narrative & explore the data yourself
        </div>
      </div>
    ));
    return ret;
  }
  render() {
    if (!this.props.loaded) {return null;}
    return (
      <NarrativeStyles
        id="NarrativeContainer"
        narrativeNavBarHeight={narrativeNavBarHeight}
      >
        {this.renderProgress()}
        <OpacityFade position="top" topHeight={narrativeNavBarHeight + progressHeight}/>
        <OpacityFade position="bottom"/>
        {this.props.currentInFocusBlockIdx !== 0 ? this.renderChevron(true) : null}
        {!this.state.showingEndOfNarrativePage ? this.renderChevron(false) : null}
        <ReactPageScroller
          ref={(c) => {this.reactPageScroller = c;}}
          containerHeight={this.props.height-progressHeight}
          pageOnChange={this.changeAppStateViaBlock}
        >
          {this.renderBlocks()}
        </ReactPageScroller>
      </NarrativeStyles>
    );
  }
  componentWillUnmount() {
    this.props.dispatch({
      type: CHANGE_URL_QUERY_BUT_NOT_REDUX_STATE,
      pathname: this.props.blocks[this.props.currentInFocusBlockIdx].dataset,
      query: queryString.parse(this.props.blocks[this.props.currentInFocusBlockIdx].url)
    });
    Mousetrap.unbind(['left', 'right', 'up', 'down']);
  }
}
export default Narrative;
