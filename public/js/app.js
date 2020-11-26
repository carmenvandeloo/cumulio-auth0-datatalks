// dashboard configuration for integration
let dashboards = {};
let selectedDashboard;
let userLanguage;
let customEvents = {};


// on page load
window.onload = async () => {
  await configureClient();
  const isAuthenticated = await auth0.isAuthenticated();

  // If is logged in -> init UI
  if (isAuthenticated) {
    return initUI();
  }

  const query = window.location.search;
  // If redirected from login
  if (query.includes('code=') && query.includes('state=')) {
    // Process the login state
    await auth0.handleRedirectCallback();
    // Set app state based on login
    initUI();
    // Use replaceState to redirect the user away and remove the querystring parameters
    window.history.replaceState({}, document.title, '/');
  }
  // If not logged in not redirected
  else {
    initUI();
  }
}


/* --------------------------------------------------------------- Authentication configuration --------------------------------------------------------------- */


/* Authentication configuration */
let auth0 = null;
const namespace = 'https://myexampleapp/';
const fetchAuthConfig = () => fetch('/auth_config.json');
const configureClient = async () => {
  const response = await fetchAuthConfig();
  const config = await response.json();
  auth0 = await createAuth0Client({
    domain: config.domain,
    client_id: config.clientId,
    audience: config.audience
  });
};

// login function
const login = async () => {
  await auth0.loginWithRedirect({
    redirect_uri: window.location.origin
  });
};

// logout function
const logout = () => {
  auth0.logout({
    returnTo: window.location.origin
  });
};


/* --------------------------------------------------------------- Cumul.io functions --------------------------------------------------------------- */

// Function that selects and loads a dashboard on the page
const selectDashboard = (selection_id, elem, parameter, container) => {
  if (selection_id) {
    // select the dashboard in the UI
    selectedDashboard = selection_id;
    if (elem && !dashboards[selection_id].isLoaded) {
      document.querySelectorAll('#dashboard-container').forEach(el => el.classList.add('invisible'));
    }
    // get authorization for the dashboard with the parameters of the user 
    if ((!elem || !elem.classList.contains('active')) && !dashboards[selection_id].isLoaded) {
      getDashboardAuthorizationToken(dashboards[selection_id].id, parameter)
        .then(response => {
          // load the dashboard with the retrieved authorization
          loadDashboard(dashboards[selection_id].id, response.id, response.token, container);
          // set the UI elements
          if(!container) {
            Object.keys(dashboards).forEach(key => {
              dashboards[key].isLoaded = false;
            });
            dashboards[selection_id].isLoaded = true;
          }
        });
      }
    if(elem) {
      // set UI
      document.querySelectorAll('.nav-item').forEach((el) => { el.classList.remove('active'); });
      elem.classList.add('active');
    }
  }
}

// Function to retrieve the dashboard authorization token from the platform's backend
const getDashboardAuthorizationToken = async (dashboard_id, parameter) => {
  try {
    // Get the platform access credentials from the current logged in user
    const accessCredentials = await auth0.getTokenSilently();
    /*
      Make the call to the backend API, using the platform user access credentials in the header
      to retrieve a dashboard authorization token for this user
    */
    const response = await fetch(`/authorization?id=${dashboard_id}`, {
      headers: new Headers({
        Authorization: `Bearer ${accessCredentials}`
      })
    });

    // Fetch the JSON result with the Cumul.io Authorization key & token
    const responseData = await response.json();
    return responseData;
  }
  catch (e) {
    // Display errors in the console
    console.error(e);
    return { error: 'Could not retrieve dashboard authorization token.' };
  }
};

// Function to add the dashboard to the page using Cumul.io embed
const loadDashboard = async (dashboard_id, key, token, container) => {
  // remove the currently integrated dashboard
  Cumulio.removeDashboard({container: '#dashboard-container'});
  // Set generic dashboard loading options
  let dashboardOptions = {
    container: '#dashboard-container',
    loader: {
      spinnerColor: '#004CB7',
      spinnerBackground: '#DCDCDC',
      fontColor: '#FFFFFF'
    }
  };
  // override the container in which to integrate the dashboard, if provided
  if(container) {
    dashboardOptions.container = container;
  }
  // use tokens if available
  if (key && token) {
    dashboardOptions.key = key;
    dashboardOptions.token = token;
  }
  // set the language of the dashboard based on the user language
  if (userLanguage) dashboardOptions.language = userLanguage;
  // the dashboardId of the dashboard to be integrated
  dashboardOptions.dashboardId = dashboard_id;
  // log the entire call to add the dashboard to the container, then execute it
  console.log(JSON.stringify(dashboardOptions, null, 2));
  Cumulio.addDashboard(dashboardOptions);
};

window.addEventListener('message', e => {
  if (e.data && e.data.type === 'init') {
    document.querySelectorAll('#dashboard-container').forEach(el => el.classList.remove('invisible'));
  }
});



/* --------------------------------------------------------------- Navigation and UI --------------------------------------------------------------- */

// Function to fetch tabs & dashboards from the backend
const fetchAndLoadDashboards = async () => {
  // Get the platform access credentials from the current logged in user
  const accessCredentials = await auth0.getTokenSilently();
  // Make the call to the backend API which in turn retrieves a list of dashboards from Cumul.io
  let result = await fetch('/dashboards', {
    headers: new Headers({
      Authorization: `Bearer ${accessCredentials}`
    })
  });
  result = await result.json();

  dashboards = {};
  // add tabs to UI per dashboard
  if(result.length > 0) {
    let ul = document.querySelector('#tabs');
    // for each dashboard, add tab
    result.forEach((tab, index) => {
      let li = document.createElement('li');
      li.classList.add('nav-item');
      // set active tab
      if (index === 0) {
        li.classList.add('active');
        selectedDashboard = tab.id;
      }
      let a = document.createElement('a');
      a.classList.add('menu-item');
      a.onclick = () => {selectDashboard(tab.id, li)};
      a.innerText = tab.name.en ? tab.name.en : "dashboard " + (index+1);
      dashboards[tab.id] = { id: tab.id, isLoaded: false };
      li.append(a);
      ul.append(li);
    })
  }
  else {
    // if no dashboards, add placeholder menu item
    let ul = document.querySelector('#tabs');
    let li = document.createElement('li');
    li.classList.add('active');
    let a = document.createElement('a');
    a.classList.add('menu-item');
    a.innerText = "a list of dashboards will appear here"
    li.append(a);
    ul.append(li);
  }
};


// loads the user interface
const initUI = async () => {
  const isAuthenticated = await auth0.isAuthenticated();
  if (isAuthenticated) {
    await fetchAndLoadDashboards();
    const user = await auth0.getUser();
    setUserDetails(user);
    document.getElementById('gated-content').style.setProperty('display', 'flex', 'important');
    loadInsightsPage();
  }
  else {
    login();
  }
};

// function to load the insight page
const loadInsightsPage = async () => {
  selectDashboard(selectedDashboard);
}

// set the user details in the UI
const setUserDetails = (user) => {
  const lang = user[namespace + 'language'];
  if (lang) {
    document.querySelectorAll('.language-btn').forEach((el) => {
      if (el.textContent === lang) {
        el.classList.add('active');
      }
      else {
        el.classList.remove('active');
      }
    })
    userLanguage = lang;
  }
  document.getElementById('user-name').textContent = user[namespace + 'firstName'];
  document.getElementById('user-image').src = user['picture'];
}

// Change the language of the dashboards
function changeLanguage(language, elem) {
  // Change the highlighted language button
  document.querySelectorAll('.language-btn').forEach((el) => { el.classList.remove('active'); });
  elem.classList.add('active');
  toggleMenu(false);
  // Change the user language based on the input
  userLanguage = language;
  // reload the current dashboard with the new language
  dashboards[selectedDashboard].isLoaded = false;
  selectDashboard(selectedDashboard);
}

const toggleMenu = (boolean) => {
  if (boolean) {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('overlay').classList.add('open');
  }
  else {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('overlay').classList.remove('open');
  }
}