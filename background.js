chrome.contentSettings.javascript.clear({});

// Get the default title
var baseTitle;
chrome.browserAction.getTitle({}, function (title) {
  baseTitle = title;
});

var tabActivated = false;
var tabPatterns = {};

var isTabActivated = function (tab) {
  if (tabActivated) {
    return true;
  } else {
    return false;
  }
};

var removeTabActivation = function (tab) {
  tabActivated = false;
  
  chrome.browserAction.setTitle(
    {
      title: baseTitle
    }
  );
  
  chrome.tabs.onUpdated.removeListener(onTabUpdated);
  chrome.contentSettings.javascript.clear({});
};

/*
 * On tab update, rewrite all the href to handle _escaped_fragment_
 */
var onTabUpdated = function (tabId, changeInfo, tab) {
  if (changeInfo.status === "loading") {
    chrome.tabs.executeScript(
      tab.id,
      {
        code: 'var links = document.getElementsByTagName("a");for(var i = 0; i < links.length; i += 1){ links[i].href = links[i].href.replace(/(\\?_escaped_fragment_=.*#!)/, "?_escaped_fragment_="); links[i].href = links[i].href.replace(/(#!)/, "?_escaped_fragment_=");}'
      }
    );
  }
};

var activateTab = function (tab) {
  tabActivated = true;
  
  chrome.contentSettings.javascript.set(
    {
      primaryPattern: '*://*/*',
      setting: 'block'
    },
    function () {
      var newUrl = tab.url.replace('#!', '?_escaped_fragment_=');
      chrome.tabs.update(
        tab.id,
        {
          url: newUrl
        },
        function () {}
      );
      
      chrome.tabs.onUpdated.addListener(onTabUpdated);
    }
  );
}

var updateExtensionIcon = function (tab) {
  if (tabActivated) {
    chrome.browserAction.setIcon({
      path: 'icon_on.png'
    });
  } else {
    chrome.browserAction.setIcon({
      path: 'icon_off.png'
    });
  }
};

/*
 * Connect to the click event of the chrome plugin to enable/disable the plugin
 */
chrome.browserAction.onClicked.addListener(function (tab) {
  if (isTabActivated(tab)) {
    // Deactivate tab
    removeTabActivation(tab);
  } else {
    // Activate tab
    activateTab(tab);
  }
  
  updateExtensionIcon(tab);
});
