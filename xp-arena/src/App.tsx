import { useRoute } from './lib/router';
import { Home } from './screens/Home';
import { Host } from './screens/Host';
import { Play } from './screens/Play';
import { Locker } from './screens/Locker';
import { Record } from './screens/Record';

export function App() {
  const { path } = useRoute();
  switch (path) {
    case '/host':
      return <Host />;
    case '/play':
      return <Play />;
    case '/locker':
      return <Locker />;
    case '/record':
      return <Record />;
    default:
      return <Home />;
  }
}
