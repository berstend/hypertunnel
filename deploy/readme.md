# Deploy

## Goals

- Provision an ubuntu box from scratch, minimal configuration
- Support both local Vagrant and remote cloud server
- Deploy a single Node.js service on port 80 and keep it alive

### Requirements

- Ansible
- Ubuntu 18.04 LTS (Bionic Beaver)  

#### Targets

- Local: Vagrant
- Remote: Hetzner Cloud



## Provision

#### Relevant config

* Modify `provisioning/defaults/vars.yml` (project_name)
* Modify `provisioning/hosts`


#### Local: Vagrant basics

```bash
# start machine
vagrant up

# stop machine
vagrant halt

# ssh into machine
vagrant ssh

# ssh into machine (vanilla ssh)
ssh -l vagrant -i ./.vagrant/machines/default/virtualbox/private_key 127.0.0.1 -p 2222

# ssh into machine (vanilla ssh, deploy user)
ssh -l deploy -i ~/.ssh/hypertunnel 127.0.0.1 -p 2222
```

#### Local

```bash
# Generate local ssh key for project (if not there yet)
ansible-playbook provisioning/local.yml

# Make sure vagrant machine is up
vagrant up

# Provision local vagrant machine
ansible-playbook provisioning/vagrant.yml -i provisioning/hosts --private-key=.vagrant/machines/default/virtualbox/private_key --user=vagrant
```


#### Remote

- Create a CX11 instance at [Hetzner](https://www.hetzner.com/cloud)
  - Use Ubuntu 18.04 and add public ssh key of the project
- Update DNS with server ip (e.g. Cloudflare)
  - Note: Disable the Cloudflare Proxy for the main domain
- Modify `provisioning/hosts` and add domain name
- Update `~/.ssh/config`:

```
Host hypertunnel.ga
  User deploy
  IdentityFile ~/.ssh/hypertunnel
  PreferredAuthentications publickey
```

```bash
# Run provisioning
ansible-playbook provisioning/remote.yml -i provisioning/hosts
```


## Deploy

#### Relevant config

* Modify `ecosystem.config.js` (ips/domains)

#### Local

```bash
npm i -g pm2@latest

# Setup deployment at vagrant box
pm2 deploy vagrant setup

```
