
import React, { useContext, useEffect, useState } from "react";
import { ThemeContext } from "providers/ThemeProvider";
import { Container, Card } from "components/common";
import axios from "axios";
import { Wrapper, Grid, Item, Content, Stats } from "./styles";
import nitt from "../../../assets/illustrations/nitt.png";
import stmarys from "../../../assets/illustrations/logo.png";
import jaiacademy from "../../../assets/illustrations/logo1.webp";

export const Education = () => {
  const { theme } = useContext(ThemeContext);
  const [college, setCollege] = useState([]);
  useEffect(() => {
    const colleges=[
        {
            name: "National Institute of Technology, Tiruchirapalli",
            id: 1,
            svn_url:" https://www.nitt.edu/",
            description: "B.Tech, Mechanical Engineering(2019-2023)",
            grade: "9.21 CGPA",
            img: nitt
        },
        {
            name: "Jai Academy",
            id: 2,
            svn_url:"https://www.jaiacademy.in/",
            description: "Completed my Inter college with PCM+CS in CBSE board.",
            grade: "91.6%",
            img: jaiacademy
        },
        {
            name: "St. Mary's School, English Medium",
            id: 3,
            svn_url:"http://www.stmaryemmauranipur.com/",
            description: "Completed my high school with CBSE board.",
            grade: "10.0 CGPA",
            img: stmarys
        }
    ];
    setCollege(colleges);
  }, []);
  return (
    <Wrapper as={Container} id="schools">
      {<h2>Education</h2>}
      <Grid>
        {college.map((node) => (
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
                <div>CGPA/PERCENTAGE: {node.grade}</div>
              </Stats>
            </Card>
          </Item>
        ))}
      </Grid>
    </Wrapper>
  );
};
