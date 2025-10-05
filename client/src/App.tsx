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
import {Categories} from "./components/category/Categories";
import {Dashboard} from "./components/dashborad/Dashboard";
import {AccountProvider} from "./context/AccountContext";
import {TransactionProvider} from "./context/TransactionContext";
import {BalanceProvider} from "./context/BalanceContext";
import {Persons} from "./components/person/Persons";
import {PersonProvider} from "./context/PersonContext";
import {CategoryProvider} from "./context/CategoryContext";
import {StoreProvider} from "./context/StoreContext";
import {Stores} from "./components/store/Stores";
import {BrandProvider} from "./context/BrandContext";
import {Brands} from "./components/brand/Brands";
import {ProductProvider} from "./context/ProductContext";
import {Products} from "./components/product/Products";
import {Transactions} from "./components/transaction/Transactions";

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
                                        <Route path="/persons" element={
                                            <TransactionProvider>
                                                <PersonProvider>
                                                    <Persons/>
                                                </PersonProvider>
                                            </TransactionProvider>
                                        } />
                                        <Route path="/categories" element={
                                            <TransactionProvider>
                                                <CategoryProvider>
                                                    <Categories/>
                                                </CategoryProvider>
                                            </TransactionProvider>
                                        } />
                                        <Route path="/stores" element={
                                            <TransactionProvider>
                                                <StoreProvider>
                                                    <Stores/>
                                                </StoreProvider>
                                            </TransactionProvider>
                                        } />
                                        <Route path="/brands" element={
                                            <TransactionProvider>
                                                <BrandProvider>
                                                    <Brands/>
                                                </BrandProvider>
                                            </TransactionProvider>
                                        } />
                                        <Route path="/products" element={
                                            <TransactionProvider>
                                                <CategoryProvider>
                                                    <ProductProvider>
                                                        <Products/>
                                                    </ProductProvider>
                                                </CategoryProvider>
                                            </TransactionProvider>
                                        } />

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
