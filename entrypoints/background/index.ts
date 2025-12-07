import { messageListener } from './background-handler';

export default defineBackground(() => {
  console.log('FB Group Aggregator background script initialized', {
    id: browser.runtime.id,
  });

  // Listen for messages from content scripts
  chrome.runtime.onMessage.addListener(messageListener);
});
