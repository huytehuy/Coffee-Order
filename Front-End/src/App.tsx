import { AppShell, Box, Burger, Button } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Link, Routes, Route } from 'react-router-dom';
import Menu from './components/Menu';
import OrdersByStatus from './components/Order';


function App() {
  const [opened, { toggle }] = useDisclosure();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 200,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header className="flex items-center ml-3">
        <Burger
          opened={opened}
          onClick={toggle}
          hiddenFrom="md"
          size="md"
        />
        <span className="ml-3">Logo</span>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Link to="/" style={{ textDecoration: 'none', width: '100%' }}>
          <Box className="bg-[#228be6] w-full py-4 flex justify-center text-white" onClick={toggle}>
            Gọi món
          </Box>
        </Link>
        <Link to="/orders" style={{ textDecoration: 'none', width: '100%' }}>
          <Box className="bg-[#228be6] w-full py-4 flex justify-center my-2 text-white" onClick={toggle}>
            Đơn nước
          </Box>
        </Link>
      </AppShell.Navbar>

      <AppShell.Main>
        <Routes>
          <Route path="/" element={<Menu />} />
          <Route path="/orders" element={<OrdersByStatus />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  );
}

export default App;
