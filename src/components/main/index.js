import React, {lazy, Suspense } from "react";
import PropTypes from 'prop-types';
import { connect } from "react-redux";
import { ThemeProvider } from 'styled-components';
import SidebarToggle from "../framework/sidebar-toggle";
import Info from "../info/info";
import Tree from "../tree";
import Map from "../map/map";
import { controlsHiddenWidth } from "../../util/globals";
import Footer from "../framework/footer";
import DownloadModal from "../download/downloadModal";
import { analyticsNewPage } from "../../util/googleAnalytics";
import handleFilesDropped from "../../actions/filesDropped";
import AnimationController from "../framework/animationController";
import { calcUsableWidth } from "../../util/computeResponsive";
import { renderNarrativeToggle } from "../narrative/renderNarrativeToggle";
import { Sidebar } from "./sidebar";
import { calcPanelDims, calcStyles } from "./utils";
import { PanelsContainer, sidebarTheme } from "./styles";
import ErrorBoundary from "../../util/errorBoundry";
import Spinner from "../framework/spinner";
import MainDisplayMarkdown from "../narrative/MainDisplayMarkdown";

const Entropy = lazy(() => import("../entropy"));
const Frequencies = lazy(() => import("../frequencies"));


@connect((state) => ({
  panelsToDisplay: state.controls.panelsToDisplay,
  panelLayout: state.controls.panelLayout,
  displayNarrative: state.narrative.display,
  narrativeIsLoaded: state.narrative.loaded,
  narrativeTitle: state.narrative.title,
  browserDimensions: state.browserDimensions.browserDimensions,
  frequenciesLoaded: state.frequencies.loaded,
  metadataLoaded: state.metadata.loaded,
  treeLoaded: state.tree.loaded
}))
class Main extends React.Component {
  constructor(props) {
    super(props);
    /* window listener to see when width changes cross threshold to toggle sidebar */
    const mql = window.matchMedia(`(min-width: ${controlsHiddenWidth}px)`);
    mql.addListener(() => this.setState({
      sidebarOpen: this.state.mql.matches,
      mobileDisplay: !this.state.mql.matches
    }));
    this.state = {
      mql,
      sidebarOpen: mql.matches,
      mobileDisplay: !mql.matches,
      showSpinner: !(this.props.metadataLoaded && this.props.treeLoaded)
    };
    analyticsNewPage();
  }
  static propTypes = {
    dispatch: PropTypes.func.isRequired
  }
  componentWillReceiveProps(nextProps) {
    if (this.state.showSpinner && nextProps.metadataLoaded && nextProps.treeLoaded) {
      this.setState({showSpinner: false});
      return;
    }
    if (
      (this.state.mql.matches) ||
      (nextProps.displayNarrative && !this.props.displayNarrative)
    ) {
      this.setState({sidebarOpen: true});
    }
  }
  componentDidMount() {
    document.addEventListener("dragover", (e) => {e.preventDefault();}, false);
    document.addEventListener("drop", (e) => {
      e.preventDefault();
      return this.props.dispatch(handleFilesDropped(e.dataTransfer.files));
    }, false);
  }
  render() {
    if (this.state.showSpinner) {
      return (<Spinner/>);
    }
    const {availableWidth, availableHeight, sidebarWidth, overlayStyles} = calcStyles(this.props.browserDimensions, this.props.displayNarrative, this.state.sidebarOpen, this.state.mobileDisplay);
    const overlayHandler = () => {this.setState({sidebarOpen: false});};
    const {big, chart} = calcPanelDims(this.props.panelLayout === "grid", this.props.panelsToDisplay, this.props.displayNarrative, availableWidth, availableHeight);
    return (
      <span>
        <AnimationController/>
        <ErrorBoundary showNothing>
          <ThemeProvider theme={sidebarTheme}>
            <DownloadModal/>
          </ThemeProvider>
        </ErrorBoundary>
        <SidebarToggle
          sidebarOpen={this.state.sidebarOpen}
          mobileDisplay={this.state.mobileDisplay}
          handler={() => {this.setState({sidebarOpen: !this.state.sidebarOpen});}}
        />
        <Sidebar
          sidebarOpen={this.state.sidebarOpen}
          width={sidebarWidth}
          height={availableHeight}
          displayNarrative={this.props.displayNarrative}
          panelsToDisplay={this.props.panelsToDisplay}
          narrativeTitle={this.props.narrativeTitle}
          mobileDisplay={this.state.mobileDisplay}
          navBarHandler={() => {this.setState({sidebarOpen: !this.state.sidebarOpen});}}
        />
        <PanelsContainer width={availableWidth} height={availableHeight} left={this.state.sidebarOpen ? sidebarWidth : 0}>
          {this.props.narrativeIsLoaded ? renderNarrativeToggle(this.props.dispatch, this.props.displayNarrative) : null}
          {this.props.displayNarrative ? null : <Info width={calcUsableWidth(availableWidth, 1)} />}
          {this.props.panelsToDisplay.includes("tree") ? <Tree width={big.width} height={big.height} /> : null}
          {this.props.panelsToDisplay.includes("map") ? <Map width={big.width} height={big.height} justGotNewDatasetRenderNewMap={false} /> : null}
          {this.props.panelsToDisplay.includes("entropy") ?
            (<Suspense fallback={null}>
              <Entropy width={chart.width} height={chart.height} />
            </Suspense>) :
            null
          }
          {this.props.panelsToDisplay.includes("frequencies") && this.props.frequenciesLoaded ?
            (<Suspense fallback={null}>
              <Frequencies width={chart.width} height={chart.height} />
            </Suspense>) :
            null
          }
          {this.props.displayNarrative ? null : <Footer width={calcUsableWidth(availableWidth, 1)} />}
          {this.props.displayNarrative && this.props.panelsToDisplay.includes("EXPERIMENTAL_MainDisplayMarkdown") ?
            <MainDisplayMarkdown width={calcUsableWidth(availableWidth, 1)}/> :
            null
          }
        </PanelsContainer>
        {/* overlay (used for mobile to open / close sidebar) */}
        {this.state.mobileDisplay ?
          <div style={overlayStyles} onClick={overlayHandler} onTouchStart={overlayHandler}/> :
          null
        }
      </span>
    );
  }
}

export default Main;
