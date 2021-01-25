import styled from "styled-components";

export const IntroWrapper = styled.div`
  padding: 4rem 0;
  display: flex;
  align-items: center;
  justify-content: space-between;

  @media (max-width: 960px) {
    flex-direction: column;
  }
`;

export const Details = styled.div`
  flex: 1;
  margin-bottom:0.5rem;
  @media (max-width: 960px) {
    width: 100%;
    margin-bottom: 2rem;
  }

  h1 {
    margin-bottom: 2rem;
    font-size: 36pt; 
    color: ${({ theme }) => (theme === "light" ? "#212121" : "#fff")};

    @media (max-width: 960px) {
      mix-blend-mode: ${({ theme }) =>
        theme === "light" ? "unset" : "difference"};
    }

    @media (max-width: 680px) {
      font-size: 30pt;
    }
  }
  h5{
    margin-bottom: 2.5rem;
    width: 500px;
    height: 200px;
    font-size: 26pt;
    font-weight: normal;
    color: ${({ theme }) => (theme === "light" ? "#707070" : "#e6e6e6")};

    @media (max-width: 960px) {
      mix-blend-mode: ${({ theme }) =>
        theme === "light" ? "unset" : "difference"};
    }

    @media (max-width: 680px) {
      margin-bottom:1rem;
      width: 300px;
      height: 150px;
      font-size: 20pt;
    }
  }
  h5 div{
    margin-bottom: 2.5rem;
    width: 500px;
    height: 200px;
    color: linear-gradient(315deg, #c73e1d 0%, #a23b72 37%, #2e86ab 100%);
    
    @media (max-width: 680px) {
      margin-bottom:1rem;
      width: 300px;
      height: 120px;
      font-size: 20pt;
    }
  }

  h4 {
    margin-bottom: 2.5rem;
    font-size: 32pt;
    font-weight: normal;
    color: ${({ theme }) => (theme === "light" ? "#707070" : "#e6e6e6")};

    @media (max-width: 960px) {
      mix-blend-mode: ${({ theme }) =>
        theme === "light" ? "unset" : "difference"};
    }

    @media (max-width: 680px) {
      font-size: 26pt;
    }
  }
  .hire-me {
    background: ${({ theme }) => (theme === "light" ? "#005554" : "#66BD88")};
    margin-right: 20px;
    border: 3px solid
      ${({ theme }) => (theme === "light" ? "#005554" : "#66BD88")};
    font-weight: bold;
  }
  .view-cv {
    background: transparent;
    color: ${({ theme }) => (theme === "light" ? "#005554" : "#66BD88")};
    border: 3px solid #005554;
    font-weight: bold;
  }
  .social {
    margin-top: 50px;
    @media(max-width:680px){
      margin-left: 25%;
    }
  }

  .social a img {
    margin-right: 15px;
  }
`;

export const Thumbnail = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start;

  @media (max-width: 960px) {
    width: 100%;
  }

  img {
    width: 70%;
  }
`;
