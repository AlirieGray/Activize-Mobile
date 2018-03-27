import React, { Component } from 'react';
import { StyleSheet, Text, View, ScrollView, Dimensions, Button, TouchableOpacity, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as eventActions from '../actions/events';
import * as modalActions from '../actions/modal';
import * as locationActions from '../actions/location';
import EventCard from './EventCard';
import Searchbar from './Searchbar';
import SearchOptions from './SearchOptions';
import CreateEventForm from './CreateEventForm';
import SortButtons from './SortButtons';
import { NavigationActions } from 'react-navigation';
import selectEvents from '../selectors/events';
import Map from './Map';

// details for Google Maps View
let { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LAT_DELTA = 0.008;
const LNG_DELTA = LAT_DELTA / ASPECT_RATIO;

const mapStyle = {
    height: 400,
    width: '100%'
}

class EventsList extends Component {

  constructor(props) {
    super(props);
    this.state = {
      location: {
        latitude: null,
        longitude: null
      },
      mapView: true,
      gotLocation: false
    }
    this.getDistanceToEvent = this.getDistanceToEvent.bind(this);
    this.setView = this.setView.bind(this);
    this.TestGetToken = this.TestGetToken.bind(this);
  }

  componentWillMount() {
    this.props.getEvents();
    this.props.navigation.setParams({ setCreateEventModal: this.props.setCreateEventModal });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("USER POSITION", position)
        this.setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          gotLocation: true
        })
        this.props.setLocation(position.coords)
      },
      (error) => console.log( error.message ),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 },
    );
    //this.TestGetToken();
  }

  componentDidMount() {

  }


  async TestGetToken() {
    try {
      const value = await AsyncStorage.getItem('token');
      if (value !== null){
        // We have data!!
        console.log("TOKEN IN ASYNC STORAGE: ", value);
      }
    } catch (error) {
      // Error retrieving data
      console.log("Could not retrieve login token :( ")
    }
  }

  static navigationOptions = ({navigation}) => ({
    title: 'Find Events',
    headerTitleStyle: {
      color: '#FFF'
    },
    headerStyle: {
      backgroundColor: '#F44336',
      display: 'flex',
      justifyContent: 'space-between',
      paddingTop: 40,
      paddingLeft: 15,
      paddingRight: 15,
      shadowOpacity: 0,
      shadowRadius: 0,
      borderBottomWidth: 0,
      elevation: 0,
      shadowOffset: {
        height: 0,
        width: 0
      },
    },
    headerLeft: (<TouchableOpacity
      style={styles.navHeaderButton}
      onPress={() => navigation.navigate('DrawerOpen')}>
        <Icon name='menu' size={30} color={'#FFF'}/>
       </TouchableOpacity>),
    headerRight: <TouchableOpacity
      style={styles.navHeaderButton}
      onPress={() => {
        navigation.state.params.setCreateEventModal(true)
      }} >
      <Icon name='add' size={30} color={'#FFF'} />
    </TouchableOpacity>
  });

  getDistanceToEvent(lat, lng) {
    var lat1 = Math.PI * lat / 180;
    var lng1 = Math.PI * lat / 180;
    var lat2 = Math.PI * this.state.latitude / 180;
    var lng2 = Math.PI * this.state.longitude / 180;

    var theta = Math.PI * (lng1 - lng2) / 180;
    var distance = Math.sin(lat1) * Math.sin(lat2) + Math.cos(lat1) * Math.cos(lat2) * Math.cos(theta)
    distance = Math.acos(distance);
    distance = distance * 180/Math.PI;
    distance = distance * 60 * 1.1515;
    return Math.round(distance * 10) / 10;
  }

  setView(viewType) {
    console.log("setting view")
    if (viewType === 'map') {
      this.setState({
        mapView: true
      })
    } else if (viewType === 'list') {
      this.setState({
        mapView: false
      })
    }

  }

  //<SortButtons mapView={this.state.mapView} mapStyle={mapStyle} toggleView={this.toggleView}/>
  render() {
    const events = this.props.events;
    console.log("Location in events list: ", this.props.location)

    var eventsView = null;
    if (this.state.mapView && this.state.gotLocation) {
      eventsView = <Map
      events={this.props.events}
      mapHeight={'100%'}
      initialRegion={{
        ...this.props.location,
        latitudeDelta: LAT_DELTA,
        longitudeDelta: LNG_DELTA }}/>
    } else if (!this.state.mapView) {
      eventsView = (
        <ScrollView contentContainerStyle={styles.contentContainer}>
          {events.map((event, index) => {
            // calculate distance from user's location
            var distance = this.getDistanceToEvent(event.lat, event.lng);
            return <EventCard key={event._id} {...event} distance={distance} {...this.props}  />
          })}
          <View style={styles.empty} />
        </ScrollView>
      )
    } else if (!this.state.gotLocation){
      eventsView = (<View style={styles.loading}><ActivityIndicator size="small" color="#0000ff"/></View>)
    }

    return (
      <View style={styles.container}>
        <CreateEventForm />
        <SearchOptions />
        <View style={styles.header}>
          <View style={{width:'100%', display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F44336', elevation: 3}}>
            <Searchbar />
          </View>
          <View style={{width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'center'}}>
            <TouchableOpacity
              style={styles.tab}
              onPress={() => {
                this.setView('map')
              }}>
              <Icon name={'language'} color={this.state.mapView ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,.65)'} size={25}/>
            </TouchableOpacity>
            <View  style={styles.divider}/>
            <TouchableOpacity
              style={styles.tab}
              onPress={() => {
                this.setView('list')
              }}>
              <Icon name={'format-list-bulleted'} color={!this.state.mapView ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,.65)'} size={25}/>
            </TouchableOpacity>
          </View>
        </View>
        {eventsView}
      </View>
    );
  }
}


const styles = StyleSheet.create({
  contentContainer: {
    minHeight: '100%',
  },
  header: {
    backgroundColor: "#F44336",
    display: 'flex',
    alignItems: 'center'
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#F5F5F5'
  },
  empty: {
    padding: 30
  },
  navHeaderButton: {
    padding: 8
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    paddingTop: 30,
    backgroundColor: '#F5F5F5'
  },
  tab: {
    width: '50%',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 5
  },
  divider: {
    height: 24,
    width: 1,
    backgroundColor: '#FFF'
  }
});

const mapStateToProps = (state) => {
  return {
    filters: state.filters,
    events: selectEvents(state.events, state.filters, state.location),
    modal: state.modal,
    location: state.location
  }
}

const mapDispatchToProps = (dispatch) => {
  const actions = Object.assign({}, eventActions, modalActions, locationActions);
  return bindActionCreators(actions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(EventsList);
