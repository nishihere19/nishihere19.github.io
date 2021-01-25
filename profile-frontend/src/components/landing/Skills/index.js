
import React, { useContext, useEffect, useState } from "react";
import { ThemeContext } from "providers/ThemeProvider";
import { Container, Card } from "components/common";
import axios from "axios";
import { Wrapper, Grid, Item, Content, Stats } from "./styles";
import linux from "../../../assets/illustrations/linux.gif";
import cpp from "../../../assets/illustrations/CPP.gif";

export const Skills = () => {
  const { theme } = useContext(ThemeContext);
  const [skill, setSkill] = useState([]);
  useEffect(() => {
    const skills=[
        {
            name: "HTML5",
            id: 1,
            img: "https://media.giphy.com/media/XAxylRMCdpbEWUAvr8/giphy.gif",
            level:"Intermediate"
        },
        {
            name: "CSS",
            id: 2,
            img: "https://media.giphy.com/media/fsEaZldNC8A1PJ3mwp/giphy.gif",
            level:"Intermediate"
        },
        {
            name: "Javascript",
            id: 3,
            img: "https://media.giphy.com/media/ln7z2eWriiQAllfVcn/giphy.gif",
            level:"Intermediate"
        },
        {
            name: "NodeJs",
            id: 4,
            img: "https://media.giphy.com/media/kdFc8fubgS31b8DsVu/giphy.gif",
            level:"Intermediate"
        },
        {
            name: "Express",
            id: 5,
            img: "https://media.giphy.com/media/LrXjC3Y2VXdRhdmA8Z/giphy.gif",
            level:"Intermediate"
        },
        {
            name: "Mongodb",
            id: 6,
            img: "https://media.giphy.com/media/wgFWLRiND4bkyYR4IN/giphy.gif",
            level:"Intermediate"
        },
        {
            name: "MySQL",
            id: 7,
            img: "https://media.giphy.com/media/vISmwpBJUNYzukTnVx/giphy.gif",
            level:"Basic"
        },
        {
            name: "React",
            id: 8,
            img: "https://media.giphy.com/media/RJzm826vu7WbJvBtxX/giphy.gif",
            level:"Intermediate"
        },
        {
            name: "C++",
            id: 9,
            img: cpp,
            level: "Intermediate"
        },
        {
            name: "Linux",
            id: 10,
            img: linux,
            level:"Basic"
        },
        {
            name: "Git",
            id: 11,
            img: "https://media.giphy.com/media/du3J3cXyzhj75IOgvA/giphy.gif",
            level:"Intermediate"
        },
        {
            name: "Python",
            id: 12,
            img: "https://media.giphy.com/media/LMt9638dO8dftAjtco/giphy.gif",
            level:"Basic"
        }
    ];
    setSkill(skills);
  }, []);
  return (
    <Wrapper as={Container} id="skills">
      {<h2>Skills</h2>}
      <Grid>
        {skill.map((node) => (
          <Item
            key={node.id}
            as="div"
            rel="noopener noreferrer"
            theme={theme}
          > 
            <Card theme={theme}>
            
              <Content>
              <div>
              <img src={node.img} />
               
              </div>
              </Content>
              <Stats theme={theme}>
                <div>Level: {node.level}</div>
              </Stats>
            </Card>
          </Item>
        ))}
      </Grid>
    </Wrapper>
  );
};
