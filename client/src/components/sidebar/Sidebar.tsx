import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import NavHeader from "./NavHeader";
import NavItem from "./NavItem";
import React, {useState} from "react";
import Logo from "../logo/Logo";
import Divider from "@mui/material/Divider";
import {
    appMenuItems,
    catalogMenuItems,
    financeMenuItems, Menu,
    peopleMenuItems,
    storeMenuItems,
    transactionMenuItems
} from "../common/Menu";

const Sidebar: React.FC = () => {
    const [selectedItemId, setSelectedItemId] = useState<string>(appMenuItems[0].id);

    const handleSelectedItem = (itemId: string) => {
        setSelectedItemId(itemId)
    }

    return (
        <Box sx={{zIndex: 100, width: 270, flexShrink: 0, }}>
            <Drawer anchor="left" open variant="permanent" PaperProps={{sx:{ width: 270, boxSizing: "border-box",}, }}>
                <Box sx={{height: "100%",}}>
                    <Box px={3}><Logo /></Box>
                    <Box sx={{ px: 3 }}>
                        <List sx={{ pt: 0 }} className="sidebarNav">
                            <NavHeader label="Dashboard"/>
                            {appMenuItems.map((item: Menu) => (
                                <NavItem item={item} key={item.id} selectedItemId={selectedItemId} handleSelectedItem={handleSelectedItem} />
                            ))}

                            <NavHeader label="Transactions"/>
                            {transactionMenuItems.map((item: Menu) => (
                                <NavItem item={item} key={item.id} selectedItemId={selectedItemId} handleSelectedItem={handleSelectedItem} />
                            ))}

                            <NavHeader label="Settings"/>
                            {financeMenuItems.map((item: Menu) => (
                                <NavItem item={item} key={item.id} selectedItemId={selectedItemId} handleSelectedItem={handleSelectedItem} />
                            ))}
                            <Divider/>
                            {peopleMenuItems.map((item: Menu) => (
                                <NavItem item={item} key={item.id} selectedItemId={selectedItemId} handleSelectedItem={handleSelectedItem} />
                            ))}
                            <Divider/>
                            {catalogMenuItems.map((item: Menu) => (
                                <NavItem item={item} key={item.id} selectedItemId={selectedItemId} handleSelectedItem={handleSelectedItem} />
                            ))}
                            <Divider/>
                            {storeMenuItems.map((item: Menu) => (
                                <NavItem item={item} key={item.id} selectedItemId={selectedItemId} handleSelectedItem={handleSelectedItem} />
                            ))}

                        </List>
                    </Box>
                </Box>
            </Drawer>
        </Box>
    );
};

export default Sidebar;
