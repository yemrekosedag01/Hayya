import { registerRootComponent } from 'expo';
import { getApp } from '@react-native-firebase/app';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import App from './App';

// Arka planda gelen bildirimleri Android kendisi gösterir; burada ek iş yok.
setBackgroundMessageHandler(getMessaging(getApp()), async () => {});

registerRootComponent(App);
