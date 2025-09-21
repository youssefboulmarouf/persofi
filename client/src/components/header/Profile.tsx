import React, { useState } from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import Typography from '@mui/material/Typography';
import {profileMenuItem} from '../common/Menu'
import {Link} from "react-router-dom";

import EmailIcon from '@mui/icons-material/Email';
import { Stack } from '@mui/system';


const Profile: React.FC = () => {
    const [anchorEl2, setAnchorEl2] = useState(null);
    const handleClick2 = (event: any) => {
        setAnchorEl2(event.currentTarget);
    };
    const handleClose2 = () => {
        setAnchorEl2(null);
    };

    return (
        <Box>
            <IconButton
                size="large"
                aria-label="show 11 new notifications"
                color="inherit"
                aria-controls="msgs-menu"
                aria-haspopup="true"
                sx={{
                    ...(typeof anchorEl2 === 'object' && {
                        color: 'primary.main',
                    }),
                }}
                onClick={handleClick2}
            >
                <Avatar
                    src={"/images/profile/user-1.jpg"}
                    alt={'ProfileImg'}
                    sx={{
                        width: 35,
                        height: 35,
                    }}
                />
            </IconButton>
            <Menu
                id="msgs-menu"
                anchorEl={anchorEl2}
                keepMounted
                open={Boolean(anchorEl2)}
                onClose={handleClose2}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                sx={{
                    '& .MuiMenu-paper': {
                        width: '360px',
                        p: 4,
                    },
                }}
            >
                <Typography variant="h5">User Profile</Typography>
                <Stack direction="row" py={3} spacing={2} alignItems="center">
                    <Avatar src={"/images/profile/user-1.jpg"} alt={"ProfileImg"} sx={{ width: 95, height: 95 }} />
                    <Box>
                        <Typography variant="subtitle2" color="textPrimary" fontWeight={600}>
                            Mathew Anderson
                        </Typography>
                        <Typography
                            variant="subtitle2"
                            color="textSecondary"
                            display="flex"
                            alignItems="center"
                            gap={1}
                        >
                            <EmailIcon />
                            info@modernize.com
                        </Typography>
                    </Box>
                </Stack>
                <Divider />
                {profileMenuItem.map((profile) => (
                    <Box key={profile.title}>
                        <Box sx={{ py: 2, px: 0 }} className="hover-text-primary">
                            <Link to={profile.href}>
                                <Stack direction="row" spacing={2}>
                                    <Box
                                        width="45px"
                                        height="45px"
                                        bgcolor="primary.light"
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="center" flexShrink="0"
                                    >
                                        <Avatar
                                            src={profile.icon}
                                            alt={profile.icon}
                                            sx={{
                                                width: 24,
                                                height: 24,
                                                borderRadius: 0,
                                            }}
                                        />
                                    </Box>
                                    <Box>
                                        <Typography
                                            variant="subtitle2"
                                            fontWeight={600}
                                            color="textPrimary"
                                            className="text-hover"
                                            noWrap
                                            sx={{
                                                width: '240px',
                                            }}
                                        >
                                            {profile.title}
                                        </Typography>
                                        <Typography
                                            color="textSecondary"
                                            variant="subtitle2"
                                            sx={{
                                                width: '240px',
                                            }}
                                            noWrap
                                        >
                                            {profile.subtitle}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Link>
                        </Box>
                    </Box>
                ))}
                <Box mt={2}>
                    <Button href="/auth/auth1/login" variant="outlined" color="primary" fullWidth>
                        Logout
                    </Button>
                </Box>
            </Menu>
        </Box>
    );
};

export default Profile;
