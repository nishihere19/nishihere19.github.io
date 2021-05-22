
import React, { useContext } from 'react';
import AnchorLink from 'react-anchor-link-smooth-scroll';
import { ThemeContext } from 'providers/ThemeProvider';
import { Header } from 'components/theme';
import { Container, Button } from 'components/common';
import heroImage from 'assets/illustrations/Header.png';
import { greeting, greetingDescription, linkedinUrl, githubUrl, cvLink } from 'data/config';
import linkedinLogo from 'assets/illustrations/linkedin_logo.png';
import githubLogo from 'assets/illustrations/github_logo.png';
import linkedinLogoWhite from 'assets/illustrations/linkedin_white.png';
import githubLogoWhite from 'assets/illustrations/github_white.png';
import { useDencrypt } from "use-dencrypt-effect";
import gmailLogo from "assets/illustrations/gmaillogo.png"

import { IntroWrapper, Details, Thumbnail } from './styles';

export const Intro = () => {
  const values = ["I am a sophomore at NIT Trichy who loves to learn new things and build stuff!"];
  const options={
    //chars:["_"],
    interval:25
  }
  function TextAdder(){
    const { result, dencrypt} = useDencrypt(options);
    
    React.useEffect(() => {
      let i = 0;
  
      const Action = setInterval(() => {
        dencrypt(values[i]);
        //console.log(dencrypt);
        i = i === values.length - 1 ? 0 : i + 1;
      }, 500);
  
      return () => clearInterval(Action);
    }, []);
    return <div>{result}</div>;
  }

  const { theme } = useContext(ThemeContext);

  return (
    <div>
      <Header />
      <IntroWrapper as={Container}>
        <Details theme={theme}>
          <h1>{greeting}</h1>
          <h4>{greetingDescription}</h4>
          <div>
            {/* <Button as={AnchorLink} href="#contact" className="hire-me">
              Hire me
            </Button>{' '} */}
            <a href={cvLink} target="_blank" rel="noreferrer">
              <Button className="view-cv">View CV</Button>
            </a>
          </div>
          <div className="social">
            {' '}
            <a href={linkedinUrl} target="_blank" rel="noreferrer">
              <img width="45" src={theme === 'light' ? linkedinLogo : linkedinLogoWhite} alt="Linkedin" />
            </a>
            <a href={githubUrl} target="_blank" rel="noreferrer">
              <img width="45" src={theme === 'light' ? githubLogo : githubLogoWhite} alt="GitHub" />
            </a>
            <a href="mailto:nishihere19@gmail.com" target="_blank" rel="noreferrer">
              <img width="45" src={theme === 'light' ? gmailLogo : gmailLogo} alt="GitHub" />
            </a>
            
          </div>
          <h5>{TextAdder()}</h5>
        </Details>
        
        <Thumbnail>
          <img src={heroImage} alt="Crio.Do" />
        </Thumbnail>
        
      </IntroWrapper>
      
    </div>
  );
};
