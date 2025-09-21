import {Link} from "react-router-dom";
import {styled} from "@mui/material";
import React from "react";

const Logo: React.FC = () => {
    const LinkStyled = styled(Link)(() => ({
        height: 70,
        width: "180px",
        overflow: "hidden",
        display: "block",
    }));

    return (
          <LinkStyled to="/">
              <img
                  src="/images/logos/light-logo.svg"
                  alt="logo"
                  height={70}
                  width={174}
              />
          </LinkStyled>
    );
};

export default Logo;
