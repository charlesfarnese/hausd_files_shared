import React from 'react';
import Header from './header';
import Menu from './menu';
import Panel from './panel';
import '../styles/app.css';
import '../styles/financials.css';
import '../styles/cleaning.css';
import '../styles/tasks.css';

import _ from 'lodash';

class App extends React.Component {

    constructor(props) {
        super(props);
        this.handleMenuItemClick = this.handleMenuItemClick.bind(this);
        this.activeListing = this.activeListing.bind(this);
        this.initialActiveListing = this.initialActiveListing.bind(this);
        this.getSearchResults = this.getSearchResults.bind(this);
        this.handleSearchActive = this.handleSearchActive.bind(this);
        this.handleSearchResults = this.handleSearchResults.bind(this);
        this.resetSidebarData = this.resetSidebarData.bind(this);
        this.getLatestData = this.getLatestData.bind(this);
        this.updateReservationField = this.updateReservationField.bind(this);
        this.updateGuest = this.updateGuest.bind(this);
        this.updateGuestField = this.updateGuestField.bind(this);
        this.updateListingField = this.updateListingField.bind(this);
        this.setActiveReservation = this.setActiveReservation.bind(this);
        this.getGuest = this.getGuest.bind(this);
        this.getListing = this.getListing.bind(this);
        this.activeListingFromReservation = this.activeListingFromReservation.bind(this);
        this.prevController = null;
        this.state = {
            panel: 'reservation',
            default_view: 'reservation_info',
            front_data: null,
            initial_reservation: props.initial_data.reservation,
            initial_guest: props.initial_data.guest,
            initial_listing: props.initial_data.reservation.listing,
            active_reservation: props.initial_data.reservation,
            active_guest: props.initial_data.guest,
            active_listing: {},
            is_search_result: false,
            search_active: false,
            search_results: [],
            initial_data: props.initial_data,
            front_event_data: null,
            is_loading_data: false,
            data_found: true
        };
    }

    componentWillMount() {
        const script = document.createElement("script");
        script.src = 'https://dl.frontapp.com/libs/frontjs.min.js';
        script.addEventListener('load', function(){ 

            // BELOW WORKS
            // window.Front.on('conversation', function(data) {console.log(data);});
            window.Front.on('conversation', function(data) {
                // Turn on loader
                this.setState({
                    front_data: data,
                    is_loading_data: true
                });
                // LOGIC FOR FINDING RES
                fetch('/front-event', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ front_data: data })
                })
                    .then(res => res.json())
                    .then(
                        (result) => {
                            console.log(result)
                            if (Object.keys(result).length !== 0 && result['reservations'].length !== 0) {
                                this.setState({
                                    is_loading_data: false,
                                    initial_data: result,
                                    initial_reservation: result.reservation,
                                    initial_guest: result.guest,
                                    initial_listing: this.activeListingFromReservation(result.reservation, result.listings),
                                    active_reservation: result.reservation,
                                    active_guest: result.guest,
                                    active_listing: this.activeListingFromReservation(result.reservation, result.listings),
                                    panel: 'reservation',
                                    default_view: 'reservation_info',
                                    data_found: true,
                                    search_active: false
    
                                });
                            } else {
                                this.setState({
                                    is_loading_data: false,
                                    initial_data: result,
                                    initial_reservation: null,
                                    initial_guest: null,
                                    initial_listing: null,
                                    active_reservation: null,
                                    active_guest: null,
                                    active_listing: null,
                                    panel: 'cleaning',
                                    default_view: 'cleaning_info',
                                    data_found: false,
                                    search_active: false
    
                                });
                            }
                            
                        }
                    )
                    .catch(error=>{
                        console.log(error)
                      })


            }.bind(this));
       }.bind(this), false);
       document.body.appendChild(script);
    }

    componentDidMount() {

        if (this.state.data_found) {
            this.setState({
                active_listing: this.initialActiveListing()
            });
        }

    }

    resetSidebarData() {
        console.log('hit');
        if (this.state.data_found) {
            this.setState((prevState) => ({
                panel: 'reservation',
                default_view: 'reservation_info',
                active_reservation: prevState.initial_data.reservation,
                active_guest: prevState.initial_data.guest,
                active_listing: this.initialActiveListing(),
                is_search_result: false,
                search_results: []
            }))
        } else {
            this.setState({
                panel: 'cleaning',
                default_view: 'cleaning_info',
                active_reservation: null,
                active_guest: null,
                active_listing: null,
                is_search_result: false,
                search_results: []

            });
        }
    }

    setActiveReservation(reservation, is_search_result) {

        let guest = {};
        let listing = {};

        if (is_search_result === true) {
            fetch('/api/guests/' + reservation.guestId, {
                method: 'GET',
            })
                .then(res => res.json())
                .then(
                    (result) => {
                        guest = result;
                        fetch('/api/listings/' + reservation.listingId, {
                            method: 'GET',
                        })
                            .then(res => res.json())
                            .then(
                                (result) => {
                                    listing = result;
                                    this.setState({
                                        active_reservation: reservation,
                                        active_guest: guest,
                                        active_listing: listing,
                                        is_search_result: is_search_result,
                                        search_active: false,
                                        panel: 'reservation',
                                        default_view: 'reservation_info',
                                    });
                                }
                            )
                            .catch(error=>{
                                console.log(error)
                              })
                    }
                )
                .catch(error=>{
                    console.log(error)
                  })
        } else {
            listing = this.state.initial_data.listings.find(
                listing => listing._id === reservation.listingId
                );
            this.setState({
                active_reservation: reservation,
                active_listing: listing,
                is_search_result: is_search_result,
                search_active: false,
                panel: 'reservation',
                default_view: 'reservation_info',
            });
        }

    }

    getGuest(guest_id) {

        fetch('/api/guests/' + guest_id, {
            method: 'GET',
        })
            .then(res => res.json())
            .then(
                (result) => {
                    console.log(result);
                    return result;
                }
            )
            .catch(error=>{
                console.log(error)
              })

    }

    getListing(listing_id) {

        fetch('/api/listings/' + listing_id, {
            method: 'GET',
        })
            .then(res => res.json())
            .then(
                (result) => {
                    return result;
                }
            )
            .catch(error=>{
                console.log(error)
              })

    }

    updateReservationField(field_key, value) {

        // Update active res object using lodash set method
        // _.set(object, path, value)
        let reservation = JSON.parse(JSON.stringify(this.state.active_reservation));
        _.set(reservation, field_key, value);
        console.log('update object')
        console.log(reservation);
        // Add Reservation update call
        const update = fetch('/api/reservations/' + reservation._id, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                reservation: reservation
            })
        })
            .then( async (response) => {

                console.log('response')
                console.log(response.status);

                if(response.ok){
                    // Search for index of res in initial data reservations array
                    // If it exists, replace
                    const res_index = this.state.initial_data.reservations.findIndex(res => {
                        return res._id === reservation._id;
                      });
                    if (res_index !== -1) {

                        let initial_data_mod = this.state.initial_data;
                        initial_data_mod.reservations[res_index] = reservation;

                        // Also check if this is initial reservation and replace if so
                        if (this.state.initial_reservation._id === reservation._id) {

                            initial_data_mod.reservation = reservation;
                            this.setState({
                                active_reservation: reservation,
                                initial_data: initial_data_mod,
                                initial_reservation: reservation
                            });
                            return true;
                        } else {
                            this.setState({
                                active_reservation: reservation,
                                initial_data: initial_data_mod
                            });
                            return true;
                        }
                    } else {
                        this.setState({
                            active_reservation: reservation
                        });
                        return true;
                    }

                }else{
                // Rest of status codes (400,500,303), can be handled here appropriately
                // console.log('error');
                return false;
                }

            })
            .catch(error=>{
                console.log(error);
                return false;
              })

        return update;

    }

    updateGuest(guest) {

    }

    updateGuestField(field_key, value) {

        // Update active guest object using lodash set method
        // _.set(object, path, value)
        let guest =  JSON.parse(JSON.stringify(this.state.active_guest));
        _.set(guest, field_key, value);

        console.log('update object')
        console.log(guest);

        const update = fetch('/api/guests/' + guest._id, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                guest: guest
            })
        })
            .then( async (response) => {

                console.log('response')
                console.log(response.status);

                if(response.ok){

                    // Also check if this is initial guest and replace if so
                    if (this.state.initial_guest._id === guest._id) {

                        let initial_data_mod = this.state.initial_data;
                        initial_data_mod.guest = guest;
                        this.setState({
                            active_guest: guest,
                            initial_data: initial_data_mod,
                            initial_guest: guest
                        });
                        return true;
                    } else {
                        this.setState({
                            active_guest: guest,
                        });
                        return true;
                    }



                }else{
                // Rest of status codes (400,500,303), can be handled here appropriately
                // console.log('error');
                return false;
                }

            })
            .catch(error=>{
                console.log(error);
                return false;
              })

        return update;
    }

    updateListingField(field_key, value) {

        // let initial_data = {...this.state.initial_data};

        // let listing = initial_data.listings.find(listing => listing._id === this.state.active_reservation.listingId);
        // _.set(listing, field_key, value);
        // let foundIndex = initial_data.listings.findIndex(x => x.id == listing.id);
        // initial_data.listings[foundIndex] = listing;
        // console.log(initial_data);

        let listing = this.state.active_listing;
        _.set(listing, field_key, value);

        this.setState({
            active_listing: listing
        });

        console.log(this.state.active_listing);

    }

    getLatestData() {
        // function to update the latest data after an update action
        // necessary if using api respnse?

    }

    handleMenuItemClick(i) {

        const default_views = {
            'reservation': 'reservation_info',
            'guest': 'guest_info',
            'verification': 'verification_info',
            'financials': 'financials_info',
            'listing': 'listing_info',
            'cleaning': 'cleaning_info',
            'tasks': 'tasks_info',
            'communications': 'communications_info'
        };

        this.setState({
            panel: i,
            default_view: default_views[i]
        });

    }

    getSearchResults(value) {

        // Update search component state
        // Update app component state with search active status
        this.handleSearchActive(value);
        // If search input has non empty value, perform search request
        if (value !== '') {

            // Abort previously running request
            this.prevController?.abort()

            this.prevController = new AbortController();
            fetch('/api/reservations/search?q=' + value, {
                method: 'GET',
                signal: this.prevController.signal,
            })
                .then(res => res.json())
                .then(
                    (result) => {

                        this.handleSearchResults(result.reservations);
                    }
                )
                .catch(error=>{
                    console.log(error)
                  })
        } else {
            this.handleSearchResults([]);
        }

    }

    handleSearchActive(value) {
        if(value !== '') {
            this.setState({
                search_active:  true,
                panel: 'search',
                default_view: 'search_results',
                active_reservation: {}
            });
        } else {
            if(this.state.data_found) {
                this.setState({
                    search_active: false,
                    panel: 'reservation',
                    default_view: 'reservation_info',
                    active_reservation: this.props.initial_data.reservation
                });
            } else {
                this.setState({
                    search_active: false,
                    panel: 'cleaning',
                    default_view: 'cleaning_info',
                    active_reservation: null
                });
            }
        }
    }

    handleSearchResults(results) {

        this.setState({
            search_results: results
        });
    }

    activeListing() {
        if (Object.keys(this.state.active_reservation).length !== 0) {
            return (this.state.initial_data.listings.find(
                listing => listing._id === this.state.active_reservation.listingId
                )
            );
        }
        return {}
    }

    activeListingFromReservation(reservation, listings) {
        if (Object.keys(reservation).length !== 0) {
            return (listings.find(
                listing => listing._id === reservation.listingId
                )
            );
        }
        return {}
    }

    initialActiveListing() {
        if (Object.keys(this.state.initial_reservation).length !== 0) {
            return (this.state.initial_data.listings.find(
                listing => listing._id === this.state.initial_reservation.listingId
                )
            );
        }
        return {}
    }

    render() {
        console.log(this.state);
        const isLoadingData = this.state.is_loading_data;
        return (
        <div id='container'>
                <div id='header'>
                    <Header
                        data={this.state.initial_data}
                        reservation={this.state.active_reservation}
                        guest={this.state.active_guest}
                        getSearchResults={this.getSearchResults}
                        handleSearchActive={this.handleSearchActive}
                        handleSearchResults={this.handleSearchResults}
                        searchActive={this.state.search_active}
                        is_loading_data={this.state.is_loading_data}
                        data_found={this.state.data_found}
                        is_search_result={this.state.is_search_result}
                    />
                </div>
                <div id='main' className={`${isLoadingData ? "blur" : ""}`}>
                    <Panel
                        name={this.state.panel}
                        default_view={this.state.default_view}
                        data={this.state.initial_data}
                        reservation={this.state.active_reservation}
                        guest={this.state.active_guest}
                        listing={this.state.active_listing}
                        search_results={this.state.search_results}
                        is_search_result={this.state.is_search_result}
                        updateReservationField={this.updateReservationField}
                        updateGuestField={this.updateGuestField}
                        updateListingField={this.updateListingField}
                        setActiveReservation={this.setActiveReservation}
                        data_found={this.state.data_found}
                    />
                    <Menu
                        handleMenuItemClick={this.handleMenuItemClick}
                        searchActive={this.state.search_active}
                        is_search_result={this.state.is_search_result}
                        resetSidebarData={this.resetSidebarData}
                        data={this.state.initial_data}
                        active={this.state.panel}
                        reservation={this.state.active_reservation}
                        guest={this.state.active_guest}
                        listing={this.state.active_listing}
                        data_found={this.state.data_found}
                        front_data={this.state.front_data}
                    />
                </div>
        </div>
        )
    }
}

export default App;
