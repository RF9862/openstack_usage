import React, { useState, useRef, useEffect, Fragment, useMemo } from 'react';
import PropTypes from 'prop-types';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircle from '@mui/icons-material/AccountCircle';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import Icon from '@mdi/react';
import Avatar from '@mui/material/Avatar';
import Logout from '@mui/icons-material/Logout';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { blue } from '@mui/material/colors';
import { Row, Col, Container } from 'react-bootstrap';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import SchoolIcon from '@mui/icons-material/School';
import TuneIcon from '@mui/icons-material/Tune';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import BiotechIcon from '@mui/icons-material/Biotech';
import EditOffIcon from '@mui/icons-material/EditOff';
import PollIcon from '@mui/icons-material/Poll';
import EngineeringIcon from '@mui/icons-material/Engineering';
import Avivator from '@/components/avivator/Avivator';
import SupportChatSlack from '../components/slackChat/SupportChatSlack';
import SupportChatGCP from '../components/slackChat/SupportChatGCP';
import { Widget, addResponseMessage } from 'react-chat-widget';

import './styles.css';
import defaultChannelIcon from './../components/slackChat/assets/team.svg';

import DLMLTab from '../components/tabsLeft/DLMLTab';
import AdjustTab from '../components/tabsLeft/AdjustTab';
import FilterTab from '../components/tabsLeft/FilterTab';
import FileTab from '../components/tabsLeft/FileTab';

import ViewTab from '../components/tabsRight/ViewTab';
import MeasureTab from '../components/tabsRight/MeasureTab';
import ReportTab from '../components/tabsRight/ReportTab';
import SettingsTab from '../components/tabsRight/SettingsTab';

import store from '../reducers';
import { connect } from 'react-redux';
import { getWindowDimensions } from '@/helpers/browser';
import { mdiChatQuestionOutline } from '@mdi/js';
import logo75 from '../assets/images/logo75.png';
import avatarImg from '../assets/images/avatar.png';

import UserPage from './user';
import AccountPage from './account';
import { useSelector } from 'react-redux';

import LoadingDialog from '@/components/custom/LoadingDialog';
import UserCanvas from '@/components/custom/UserCanvas';
import MLLabelCanvas from '@/components/custom/MLLabelCanvas';
import LockScreen from '@/components/custom/LockScreen';
import TrainingDialog from '@/components/tabsLeft/contents/dlml/dialog/TrainingDialog'; // added by Wang
import TargetDrawingDialog from '@/components/tabsLeft/contents/dlml/dialog/TargetDrawingDialog';
import MLPopupDialog from '@/components/tabsLeft/contents/dlml/dialog/MLPopupDialog';
import { useFlagsStore } from '@/state';
import AnalysisList from '@/components/tabsRight/contents/report/AnalysisList';
import VisualImageList from '@/components/tabsRight/contents/report/VisualImageList';
import VisualLineChart from '@/components/tabsRight/contents/report/VisualLineChart';
import VisualTable from '@/components/tabsRight/contents/report/VisualTable';
import ICTMethodDialog from '@/components/tabsLeft/contents/dlml/dialog/ICTMethoadDialog';
import BasicDialog from '@/components/tabsLeft/contents/dlml/dialog/BasicDialog';
import CustomDialog from '@/components/tabsLeft/contents/dlml/dialog/CustomDialog';
import CustomNameDialog from '@/components/tabsLeft/contents/dlml/dialog/CustomNameDialog';
import CellposeDialog from '@/components/tabsLeft/contents/dlml/dialog/CellposeDialog';
import TissueHPMethodDialog from '@/components/tabsLeft/contents/dlml/dialog/TissueHPMethodDialog';
import MfiberDialog from '@/components/tabsLeft/contents/dlml/dialog/MfiberDialog';
import MridgeDialog from '@/components/tabsLeft/contents/dlml/dialog/MridgeDialog';
import MouseTrackDialog from '@/components/tabsLeft/contents/dlml/dialog/MouseTrackDialog';
import LabelFreeDialog from '@/components/tabsLeft/contents/dlml/dialog/LabelFreeDialog';
import { getVideoSource } from '@/api/experiment';
import LabelFreeSelectDialog from '@/components/tabsLeft/contents/dlml/dialog/LabelFreeSelectDialog';
import CellPaintingV3Dialog from '@/components/tabsLeft/contents/dlml/dialog/CellPaintingV3Dialog';
import CellPaintingV3SelectDialog from '@/components/tabsLeft/contents/dlml/dialog/CellPaintingV3SelectDialog';
import ConfluencyMethodDialog from '@/components/tabsLeft/contents/dlml/dialog/ConfluencyMethodDialog';
import MLPopUPContainer from '@/components/tabsLeft/MLPopUpContainer';

function TabContainer(props) {
  return (
    <Typography component="div" style={{ padding: 0 }}>
      {props.children}
    </Typography>
  );
}

TabContainer.propTypes = {
  children: PropTypes.node.isRequired,
};

const mapStateToProps = (state) => ({
  isFilesAvailable: state.files.isFilesAvailable,
  filesChosen: state.vessel.selectedVesselHole,
  isFilesChosenAvailable: state.files.isFilesChosenAvailable,
  currentVesseelCount: state.vessel.currentVesseelCount,
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1976d2',
    },
  },
});

const fixedBarHeight = 66; //91=>68
const MainFrame = (props) => {
  const { currentVesseelCount } = props;
  const [userPage, setUserPage] = useState(false);
  const [accountPage, setAccountPage] = useState(false);
  const [vivPage, setVivPage] = useState(true);
  const [videoPage, setVideoPage] = useState(false);
  const [showChatFlag, setShowChatFlag] = useState(false);
  const imagePathForAvivator = useSelector(
    (state) => state.files.imagePathForAvivator,
  );

  const DialogLoadingFlag = useFlagsStore((store) => store.DialogLoadingFlag);
  const UserCanvasFlag = useFlagsStore((store) => store.UserCanvasFlag);
  const DialogLockFlag = useFlagsStore((store) => store.DialogLockFlag);
  const DialogTrainingFlag = useFlagsStore((store) => store.DialogTrainingFlag);
  const DialogTargetDrawingFlag = useFlagsStore(
    (store) => store.DialogTargetDrawingFlag,
  ); //added by Wang
  const ReportVisualFlag = useFlagsStore((store) => store.ReportVisualFlag);
  const MLCanvasFlag = useFlagsStore((store) => store.MLCanvasFlag);
  const DialogCustomFlag = useFlagsStore((store) => store.DialogCustomFlag);
  const DialogCustomNameFlag = useFlagsStore(
    (store) => store.DialogCustomNameFlag,
  );

  const DialogCellposeFlag = useFlagsStore((store) => store.DialogCellposeFlag);
  const [videoSource, setVideoSource] = useState(null);

  const handleVideoTimeUpdate = (e) => {
    let duration = Math.floor(e.target.duration);
    let currentTime = Math.floor(e.target.currentTime);

    store.dispatch({
      type: 'set_video_time_duration',
      payload: duration,
    });

    store.dispatch({
      type: 'set_video_current_time',
      payload: currentTime,
    });
  };

  const imageViewAreaRef = useRef(null);
  const [height, setHeight] = useState(100);
  const handleResize = () => {
    let { height } = getWindowDimensions();
    setHeight(height);
    localStorage.setItem(
      'imageViewSizeWidth',
      imageViewAreaRef.current.offsetWidth,
    );
    localStorage.setItem('imageViewSizeHeight', height - fixedBarHeight);
    // added by Wang
    localStorage.setItem(
      'imageViewSizeTop',
      imageViewAreaRef.current.offsetTop,
    );
    localStorage.setItem(
      'imageViewSizeLeft',
      imageViewAreaRef.current.offsetLeft,
    );
  };

  const [rightTabVal, setRightTabVal] = useState(0);
  const [leftTabVal, setLeftTabVal] = useState(3);
  const handleRightTabChange = (newValue) => {
    setRightTabVal(newValue);
  };
  const handleLeftTabChange = (newValue) => {
    setLeftTabVal(newValue);
  };

  const [anchorEl, setAnchorEl] = useState(null);
  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleLogout = () => {
    localStorage.removeItem('rememberFlag');
    localStorage.removeItem('token');
    localStorage.removeItem('tokenType');
    localStorage.removeItem('user');
    store.dispatch({ type: 'auth_logOut' });
  };
  const handleUserPage = () => {
    setAccountPage(false);
    setVivPage(false);
    setUserPage(true);
  };
  const handleOpenAccount = () => {
    setUserPage(false);
    setVivPage(false);
    setAccountPage(true);
  };
  const handleOpenViv = () => {
    setUserPage(false);
    setAccountPage(false);
    setVivPage(true);
  };

  useEffect(() => {
    addResponseMessage('Welcome to LifeAnalytics!');
  }, []);

  const handleSetVideoUrl = async () => {
    let res = await getVideoSource(imagePathForAvivator);

    const videoPlayer = document.getElementById('videoPlayer');

    videoPlayer.src =
      process.env.REACT_APP_BASE_API_URL + 'static/' + res.data.filepath;

    //setVideoSource(videoUrl);
  };

  useEffect(() => {
    if (Array.isArray(imagePathForAvivator)) return;
    if (imagePathForAvivator === null || imagePathForAvivator === '') return;

    // if (
    //   imagePathForAvivator.includes('.mp4') ||
    //   imagePathForAvivator.includes('.avi')
    // ) {
    //   setVivPage(false);
    //   setVideoPage(true);
    // } else {
    //   setVivPage(true);
    //   setVideoPage(false);
    // }
    setVivPage(true);

    // handleSetVideoUrl();
  }, [imagePathForAvivator]);

  useEffect(() => {
    if (
      document.getElementsByClassName('rcw-launcher').length > 0 &&
      showChatFlag
    ) {
      if (!document.getElementById('rcw-conversation-container'))
        document.getElementsByClassName('rcw-launcher')[0].click();
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.addEventListener('resize', handleResize);
    };
  }, [imageViewAreaRef, showChatFlag]);

  const generateChatResponse = async (message) => {
    const url = 'https://api.openai.com/v1/engines/davinci/completions';
    const prompt = `User: ${message}\nBot: `;
    const data = {
      prompt,
      max_tokens: 60,
      temperature: 0.7,
      n: 1,
      stop: '\n',
    };
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
    };
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    const { choices } = await response.json();
    return choices[0].text.trim();
  };

  const handleNewUserMessage = async (newMessage) => {
    // console.log(`New message incoming! ${newMessage}`);
    // Now send the message throught the backend API

    //add messsage to slack channel

    //end
    let responseMessage = await generateChatResponse(newMessage);
    // console.log("new response --->", responseMessage);
    addResponseMessage(responseMessage);
  };

  const HeaderContent = () => {
    // const [showChatFlag, setShowChatFlag] = useState(false);
    const user = useSelector((state) => state.auth.user);
    let initialName = '';
    if (user === null) {
      initialName = '';
    } else if (user.fullName.length > 0) {
      const nameArray = user.fullName.split(' ');
      nameArray.forEach((name) => {
        if (name.length <= 0) return;
        initialName += name.charAt(0).toUpperCase();
      });
    }

    return (
      <Box sx={{ flexGrow: 1, height: '65px' }}>
        <ThemeProvider theme={darkTheme}>
          <AppBar className="main-header" position="static">
            <Toolbar>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                color="inherit"
              >
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                <img width="116" height="48" src={logo75} alt="Logo" />
              </Typography>
              <div>
                <IconButton
                  size="large"
                  aria-label="account of current user"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  color="inherit"
                  className="btn btn-sm pt-0 pb-0"
                  style={{}}
                  onClick={() => {
                    setShowChatFlag(!showChatFlag);
                  }}
                >
                  <Icon
                    size={1}
                    horizontal
                    vertical
                    rotate={180}
                    color="#EFEFEF"
                    path={mdiChatQuestionOutline}
                  ></Icon>
                </IconButton>
                <IconButton
                  size="large"
                  aria-label="account of current user"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  onClick={handleMenu}
                  color="inherit"
                >
                  <AccountCircle />
                </IconButton>
                <Menu
                  id="menu-appbar"
                  anchorEl={anchorEl}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                >
                  <MenuItem onClick={handleOpenViv}>My Workspace</MenuItem>
                  <MenuItem onClick={handleOpenAccount}>My account</MenuItem>
                </Menu>
                <IconButton size="large" onClick={handleUserPage}>
                  <Avatar sx={{ width: 30, height: 30, bgcolor: blue[500] }}>
                    {' '}
                    {initialName}{' '}
                  </Avatar>
                </IconButton>
                <IconButton size="large" onClick={handleLogout} color="inherit">
                  <Logout />
                </IconButton>
              </div>
            </Toolbar>
          </AppBar>
        </ThemeProvider>
      </Box>
    );
  };
  // const FooterContent = () => {
  //   return (
  //     <>
  //       {/* <SupportChatSlack /> */}
  //       <Box
  //         style={{
  //           bottom: '0px',
  //           backgroundColor: '#212529',
  //           display: 'flex',
  //           position: 'fixed',
  //           width: '100%',
  //         }}
  //       >
  //         <button
  //           className="btn btn-sm pt-0 pb-0"
  //           style={{ marginLeft: 'auto', marginRight: '280px' }}
  //           onClick={() => {
  //             setShowChatFlag(!showChatFlag);
  //           }}
  //         >
  //           <Icon
  //             size={1}
  //             horizontal
  //             vertical
  //             rotate={180}
  //             color="#EFEFEF"
  //             path={mdiChatQuestionOutline}
  //           ></Icon>
  //         </button>
  //       </Box>
  //     </>
  //   );
  // };
  const renderPart = (rowCount, index) => {
    return (
      <Col
        ref={imageViewAreaRef}
        style={{
          backgroundColor: '#ddd',
          height: ((height - fixedBarHeight) / rowCount).toString() + 'px',
          overflowY: 'auto',
          border: '1px solid black',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {userPage && <UserPage />}
        {accountPage && <AccountPage />}
        {vivPage && <Avivator source={imagePathForAvivator} />}
      </Col>
    );
  };
  return (
    <>
      <HeaderContent />
      <Container
        fluid={true}
        className="p-0"
        style={{ height: (height - fixedBarHeight).toString() + 'px' }}
      >
        <Row noGutters>
          <Col
            xs={2}
            className="p-2 border-right"
            style={{
              height: (height - fixedBarHeight).toString() + 'px',
              overflowY: 'auto',
            }}
          >
            {' '}
            {/* Left Panel */}
            {ReportVisualFlag == 0 && (
              <div className="card border">
                <Tabs
                  // variant="scrollable"
                  value={leftTabVal}
                  aria-label="tabs example"
                  TabIndicatorProps={{
                    style: {
                      flexDirection: 'row-right',
                      justifyContent: 'flex-start',
                    },
                  }}
                >
                  <Tab
                    className="tab-button"
                    key={0}
                    icon={<SchoolIcon />}
                    aria-label="school"
                    value={0}
                    onFocus={() => handleLeftTabChange(0)}
                  />
                  <Tab
                    className="tab-button"
                    key={1}
                    icon={<TuneIcon />}
                    aria-label="tune"
                    value={1}
                    onFocus={() => handleLeftTabChange(1)}
                  />
                  <Tab
                    className="tab-button"
                    key={2}
                    icon={<FilterAltIcon />}
                    aria-label="filter"
                    value={2}
                    onFocus={() => handleLeftTabChange(2)}
                  />
                  <Tab
                    className="tab-button"
                    key={3}
                    icon={<InsertDriveFileIcon />}
                    aria-label="file"
                    value={3}
                    onFocus={() => handleLeftTabChange(3)}
                  />
                </Tabs>
                {leftTabVal === 0 && (
                  <TabContainer>
                    <DLMLTab />
                  </TabContainer>
                )}
                {leftTabVal === 1 && (
                  <TabContainer>
                    <AdjustTab />
                  </TabContainer>
                )}
                {leftTabVal === 2 && (
                  <TabContainer>
                    <FilterTab />
                  </TabContainer>
                )}
                {leftTabVal === 3 && (
                  <TabContainer>
                    <FileTab />
                  </TabContainer>
                )}
              </div>
            )}
            {ReportVisualFlag == 1 && <AnalysisList />}
          </Col>
          {ReportVisualFlag == 1 && (
            <Col xs={8}>
              <div style={{ height: '100vh' }}>
                <div className="visual-main-panel-screen">
                  <VisualImageList />
                  <VisualLineChart />
                </div>
                <div className="visual-amin-panel-table">
                  <VisualTable rowHeaders caption="Grindcore bands" sortable />
                </div>
              </div>
            </Col>
          )}
          {ReportVisualFlag == 0 && currentVesseelCount === 1 && (
            <Col
              xs={8}
              ref={imageViewAreaRef}
              style={{
                backgroundColor: '#ddd',
                height: (height - fixedBarHeight).toString() + 'px',
                overflowY: 'auto',
                borderBottom: '2px solid black',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {``}

              {/* Central Panel, Viv Image Viewer */}
              {userPage && <UserPage />}
              {accountPage && <AccountPage />}
              {vivPage && <Avivator source={imagePathForAvivator} />}
              {videoPage && (
                <video
                  controls
                  id="videoPlayer"
                  style={{ width: '100%' }}
                  onTimeUpdate={handleVideoTimeUpdate}
                >
                  Your browser does not support the video tag.
                </video>
              )}
              {UserCanvasFlag && <UserCanvas />}
              {MLCanvasFlag && <MLLabelCanvas />}
            </Col>
          )}
          {ReportVisualFlag == 0 && currentVesseelCount === 2 && (
            <Col xs={8}>
              {' '}
              {/* Central Panel, Viv Image Viewer */}
              <Col
                ref={imageViewAreaRef}
                style={{
                  backgroundColor: '#ddd',
                  height: ((height - fixedBarHeight) / 2).toString() + 'px',
                  overflowY: 'auto',
                  borderBottom: '3px solid black',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {userPage && <UserPage />}
                {accountPage && <AccountPage />}
                {vivPage && <Avivator source={imagePathForAvivator} />}
                {videoPage && (
                  <video
                    controls
                    style={{ width: '100%' }}
                    id="videoPlayer"
                    onTimeUpdate={handleVideoTimeUpdate}
                  >
                    Your browser does not support the video tag.
                  </video>
                )}
                {UserCanvasFlag && <UserCanvas />}
                {MLCanvasFlag && <MLLabelCanvas />}
              </Col>
              <Col
                ref={imageViewAreaRef}
                style={{
                  backgroundColor: '#ddd',
                  height: ((height - fixedBarHeight) / 2).toString() + 'px',
                  overflowY: 'auto',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {userPage && <UserPage />}
                {accountPage && <AccountPage />}
                {vivPage && <Avivator source={imagePathForAvivator} />}
                {videoPage && (
                  <video
                    controls
                    style={{ width: '100%' }}
                    id="videoPlayer"
                    onTimeUpdate={handleVideoTimeUpdate}
                  >
                    Your browser does not support the video tag.
                  </video>
                )}
                {UserCanvasFlag && <UserCanvas />}
                {MLCanvasFlag && <MLLabelCanvas />}
              </Col>
            </Col>
          )}
          {ReportVisualFlag == 0 && currentVesseelCount === 4 && (
            <Fragment>
              <Col xs={4} style={{ borderRight: '3px solid black' }}>
                {' '}
                {/* Central Panel, Viv Image Viewer */}
                <Col
                  ref={imageViewAreaRef}
                  style={{
                    backgroundColor: '#ddd',
                    height: ((height - fixedBarHeight) / 2).toString() + 'px',
                    overflowY: 'auto',
                    borderBottom: '3px solid black',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {userPage && <UserPage />}
                  {accountPage && <AccountPage />}
                  {vivPage && <Avivator source={imagePathForAvivator} />}
                  {videoPage && (
                    <video
                      controls
                      style={{ width: '100%' }}
                      id="videoPlayer"
                      onTimeUpdate={handleVideoTimeUpdate}
                    >
                      Your browser does not support the video tag.
                    </video>
                  )}
                  {UserCanvasFlag && <UserCanvas />}
                  {MLCanvasFlag && <MLLabelCanvas />}
                </Col>
                <Col
                  ref={imageViewAreaRef}
                  style={{
                    backgroundColor: '#ddd',
                    height: ((height - fixedBarHeight) / 2).toString() + 'px',
                    overflowY: 'auto',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {userPage && <UserPage />}
                  {accountPage && <AccountPage />}
                  {vivPage && <Avivator source={imagePathForAvivator} />}
                  {videoPage && (
                    <video
                      controls
                      style={{ width: '100%' }}
                      id="videoPlayer"
                      onTimeUpdate={handleVideoTimeUpdate}
                    >
                      Your browser does not support the video tag.
                    </video>
                  )}
                  {UserCanvasFlag && <UserCanvas />}
                  {MLCanvasFlag && <MLLabelCanvas />}
                </Col>
              </Col>
              <Col xs={4}>
                {' '}
                {/* Central Panel, Viv Image Viewer */}
                <Col
                  ref={imageViewAreaRef}
                  style={{
                    backgroundColor: '#ddd',
                    height: ((height - fixedBarHeight) / 2).toString() + 'px',
                    overflowY: 'auto',
                    borderBottom: '3px solid black',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {userPage && <UserPage />}
                  {accountPage && <AccountPage />}
                  {vivPage && <Avivator source={imagePathForAvivator} />}
                  {videoPage && (
                    <video
                      controls
                      style={{ width: '100%' }}
                      id="videoPlayer"
                      onTimeUpdate={handleVideoTimeUpdate}
                    >
                      Your browser does not support the video tag.
                    </video>
                  )}
                  {UserCanvasFlag && <UserCanvas />}
                  {MLCanvasFlag && <MLLabelCanvas />}
                </Col>
                <Col
                  ref={imageViewAreaRef}
                  style={{
                    backgroundColor: '#ddd',
                    height: ((height - fixedBarHeight) / 2).toString() + 'px',
                    overflowY: 'auto',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {userPage && <UserPage />}
                  {accountPage && <AccountPage />}
                  {vivPage && <Avivator source={imagePathForAvivator} />}
                  {videoPage && (
                    <video
                      controls
                      style={{ width: '100%' }}
                      id="videoPlayer"
                      onTimeUpdate={handleVideoTimeUpdate}
                    >
                      Your browser does not support the video tag.
                    </video>
                  )}
                  {UserCanvasFlag && <UserCanvas />}
                  {MLCanvasFlag && <MLLabelCanvas />}
                </Col>
              </Col>
            </Fragment>
          )}
          <Col
            xs={2}
            className="border-left p-2"
            style={{
              height: (height - fixedBarHeight).toString() + 'px',
              overflowY: 'auto',
            }}
          >
            <div className="card border">
              <Tabs
                allowScrollButtonsMobile
                value={rightTabVal}
                aria-label="scrollable auto tabs example"
              >
                <Tab
                  className="tab-button"
                  variant="fullWidth"
                  icon={<BiotechIcon />}
                  aria-label="BiotechIcon"
                  onFocus={() => handleRightTabChange(0)}
                />
                <Tab
                  className="tab-button"
                  variant="fullWidth"
                  icon={<EditOffIcon />}
                  aria-label="EditOffIcon"
                  onFocus={() => handleRightTabChange(1)}
                />
                <Tab
                  className="tab-button"
                  variant="fullWidth"
                  icon={<PollIcon />}
                  aria-label="PollIcon"
                  onFocus={() => handleRightTabChange(2)}
                />
                <Tab
                  className="tab-button"
                  variant="fullWidth"
                  icon={<EngineeringIcon />}
                  aria-label="EngineeringIcon"
                  onFocus={() => handleRightTabChange(3)}
                />
              </Tabs>
              {rightTabVal === 0 && (
                <TabContainer>
                  <ViewTab />
                </TabContainer>
              )}
              {rightTabVal === 1 && (
                <TabContainer>
                  <MeasureTab />
                </TabContainer>
              )}
              {rightTabVal === 2 && (
                <TabContainer>
                  <ReportTab />
                </TabContainer>
              )}
              {rightTabVal === 3 && (
                <TabContainer>
                  <SettingsTab />
                </TabContainer>
              )}
            </div>
          </Col>
        </Row>
      </Container>
      {showChatFlag && (
        <SupportChatGCP
          updateShowFlag={() => {
            setShowChatFlag(false);
          }}
        />
        // <Widget
        //   handleNewUserMessage={handleNewUserMessage}
        //   profileAvatar={defaultChannelIcon}
        //   titleAvatar={defaultChannelIcon}
        //   profileClientAvatar={avatarImg}
        //   title="STATUS"
        //   subtitle="ias-support-chat"
        //   senderPlaceHolder="Enter your message."
        // />
      )}
      {DialogLoadingFlag && <LoadingDialog />}
      {DialogLockFlag && <LockScreen />}
      {DialogTrainingFlag && <TrainingDialog />}
      {DialogTargetDrawingFlag && <TargetDrawingDialog />}
      {DialogCustomNameFlag && <CustomNameDialog />}
      {DialogCustomFlag && <CustomDialog />}
      {/* <FooterContent /> */}
      <CellposeDialog />
      <MLPopupDialog />
      <ICTMethodDialog />
      <MfiberDialog />
      <MridgeDialog />
      <MouseTrackDialog />
      <CellPaintingV3Dialog />
      <CellPaintingV3SelectDialog />
      <MLPopUPContainer />
      <TissueHPMethodDialog />
      <LabelFreeDialog />
      <LabelFreeSelectDialog />
      <BasicDialog />
      <ConfluencyMethodDialog />
    </>
  );
};

export default connect(mapStateToProps)(MainFrame);
