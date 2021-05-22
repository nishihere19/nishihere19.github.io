
import React, { useContext, useEffect, useState } from "react";
import { ThemeContext } from "providers/ThemeProvider";
import { Container, Card } from "components/common";
import { Wrapper, Grid, Item, Content, Stats } from "./styles";
import virtuera from "../../../assets/illustrations/virtuera.jpeg";
import gssoc from "../../../assets/illustrations/gssoc.png";

export const Experience = () => {
  const { theme } = useContext(ThemeContext);
  const [company, setCompany] = useState([]);
  useEffect(() => {
    const companies=[
        {
            name: "Virtuera",
            id: 1,
            svn_url:"https://www.linkedin.com/company/myvirtuera/mycompany/",
            description: "Backend Developer Intern",
            start: "January, 2021",
            end:"April, 2021",
            img: virtuera
        },
        {
            name: "GirlScript Summer Of Code'21",
            id: 2,
            svn_url:"https://gssoc.girlscript.tech/profile.html?id=nishihere19",
            description: "Participant",
            start: "March, 2021",
            end:"May, 2021",
            img: gssoc
        }
    ];
    setCompany(companies);
  }, []);
  return (
    <Wrapper as={Container} id="experience">
      {<h2>Experience</h2>}
      <Grid>
        {company.map((node) => (
          <Item
            key={node.id}
            as="a"
            href={node.svn_url}
            target="_blank"
            rel="noopener noreferrer"
            theme={theme}
          > 
            <Card theme={theme}>
            
              <Content>
              <div>
              <img src={node.img} />
                <h4>{node.name}</h4>
              </div>
              
                <p>{node.description}</p>
              </Content>
              <Stats theme={theme}>
                <div>Since {node.start}</div>
              </Stats>
            </Card>
          </Item>
        ))}
      </Grid>
    </Wrapper>
  );
};
