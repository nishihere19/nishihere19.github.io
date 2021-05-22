
import React, { useContext, useEffect, useState } from "react";
import { ThemeContext } from "providers/ThemeProvider";
import { Container, Card } from "components/common";
import Star from "components/common/Icons/Star";
import Fork from "components/common/Icons/Fork";
import axios from "axios";
import { Wrapper, Grid, Item, Content, Stats } from "./styles";

export const Organisations = () => {
  const { theme } = useContext(ThemeContext);
  const [repos, setRepos] = useState([]);
  //console.log(process.env.GITHUB_TOKEN);
  const repoarr=["Letusmeet","Synergy-NITT","NITTSAC","delta"];
  const finalRepos=[]
  useEffect(() => {
    axios
      .get("https://api.github.com/user/orgs", {
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
        //console.log(repoData);
        repoData.map((a) =>{
          for(i=0;i<5;i++) if(repoarr[i]===a.login) finalRepos.push(a);
        } 
        );
        //console.log(repoData,finalRepos);
        //repoData = repoData.slice(0, 8);
        setRepos(finalRepos);
      })
      .catch((error) => console.log(error));
  }, []);
  return (
    <Wrapper as={Container} id="organisations">
      {repos.length > 0 && <h2>Organisations</h2>}
      <Grid>
        {repos.map((node) => (
          <Item
            key={node.id}
            as="a"
            href={'https://github.com/'+node.login}
            target="_blank"
            rel="noopener noreferrer"
            theme={theme}
          >
            <Card theme={theme}>
              <Content>
              <img src={node.avatar_url} />
                <h4>{node.login}</h4>
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
