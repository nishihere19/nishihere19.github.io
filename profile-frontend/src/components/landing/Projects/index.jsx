
import React, { useContext, useEffect, useState } from "react";
import { ThemeContext } from "providers/ThemeProvider";
import { Container, Card } from "components/common";
import Star from "components/common/Icons/Star";
import Fork from "components/common/Icons/Fork";
import axios from "axios";
import { Wrapper, Grid, Item, Content, Stats } from "./styles";

export const Projects = () => {
  const { theme } = useContext(ThemeContext);
  const [repos, setRepos] = useState([]);
  //console.log(process.env.GITHUB_TOKEN);
  const repoarr=["bubble_game-SOP","React-app-project","Nodejs-File-Manager","Word-counter","News-generator","Paint-On-Canvas"];
  const finalRepos=[]
  useEffect(() => {
    axios
      .get("https://api.github.com/user/repos", {
        params: {
          visibility: "public",
          per_page: 100,
          affiliation: "owner,collaborator",
        },
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
        },
      })
      .then((response) => response.data)
      .then((repoData) => {
        var i;
        repoData.map((a) =>{
          for(i=0;i<6;i++) if(repoarr[i]===a.name) finalRepos.push(a);
        } 
        );
        //console.log(repoData,finalRepos);
        //repoData = repoData.slice(0, 8);
        setRepos(finalRepos);
      })
      .catch((error) => console.log(error));
  }, []);
  return (
    <Wrapper as={Container} id="projects">
      {repos.length > 0 && <h2>Projects</h2>}
      <Grid>
        {repos.map((node) => (
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
                <h4>{node.name}</h4>
                <p>{node.description}</p>
              </Content>
              <Stats theme={theme}>
                <div>
                  <Star color={theme === "light" ? "#000" : "#fff"} />
                  <span>{node.stargazers_count}</span>
                </div>
                <div>
                  <Fork color={theme === "light" ? "#000" : "#fff"} />
                  <span>{node.forks_count}</span>
                </div>
              </Stats>
            </Card>
          </Item>
        ))}
      </Grid>
    </Wrapper>
  );
};
