export const themeStorageKey = 'foosrank-theme'

/**
 * Runs before first paint so the document uses the persisted or system theme
 * without flashing the light palette first.
 */
export const themeInitScript = `(function(){try{var p=localStorage.getItem('${themeStorageKey}');var d=p==='dark'||(p!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light'}catch(e){document.documentElement.dataset.theme='light'}})()`
