import React from "react";
import {BrowserRouter, Routes, Route} from "react-router-dom";
import {Container, CssBaseline, styled} from "@mui/material";
import {ThemeProvider} from "@mui/material/styles";
import {ThemeSettings} from "./theme/Theme";
import Sidebar from "./components/sidebar/Sidebar";
import Header from "./components/header/Header";
import Box from "@mui/material/Box";
import AppProviders from "./AppProviders";
import {Accounts} from "./components/account/Accounts";
import {Category} from "./components/category/Category";
import {Dashboard} from "./components/dashborad/Dashboard";
import {AccountProvider} from "./context/AccountContext";
import {TransactionProvider} from "./context/TransactionContext";
import {BalanceProvider} from "./context/BalanceContext";

const PageWrapper = styled("div")(() => ({
    display: "flex",
    flexGrow: 1,
    paddingBottom: "60px",
    flexDirection: "column",
    zIndex: 1,
    width: "100%",
    backgroundColor: "transparent",
}));

const MainWrapper = styled("div")(() => ({
    display: "flex",
    minHeight: "100vh",
    width: "100%",
}));

const App: React.FC = () => {
    const theme = ThemeSettings();

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <MainWrapper>
                <BrowserRouter>
                    <Sidebar />
                    <PageWrapper className="page-wrapper">
                        <Header />
                        <Container sx={{maxWidth: "100%!important",}}>
                            <Box sx={{ minHeight: "calc(100vh - 170px)" }}>
                                <AppProviders>
                                    <Routes>
                                        <Route path="/" element={<Dashboard/>} />
                                        <Route path="/accounts" element={
                                            <BalanceProvider>
                                                <TransactionProvider>
                                                    <AccountProvider>
                                                        <Accounts/>
                                                    </AccountProvider>
                                                </TransactionProvider>
                                            </BalanceProvider>
                                        } />
                                        <Route path="/category" element={<Category/>} />
                                    </Routes>
                                </AppProviders>
                            </Box>
                        </Container>
                    </PageWrapper>
                </BrowserRouter>
            </MainWrapper>
        </ThemeProvider>
    );
};

export default App;
